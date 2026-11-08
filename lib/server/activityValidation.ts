/**
 * Validation of activity sessions uploaded by the VS Code extension.
 *
 * Everything the extension sends is treated as untrusted input: a modified
 * client could send anything. This module checks shape, ranges and internal
 * consistency. It does NOT decide who may upload for which project; that is
 * checked separately against the database.
 *
 * It has no imports, so it is easy to test on its own.
 */

export const MAX_SESSIONS_PER_REQUEST = 25;
export const MAX_ENTRIES_PER_SESSION = 200;
export const MAX_BODY_CHARS = 1_000_000;

const DAY_MS = 86_400_000;
const MAX_SESSION_LENGTH_MS = 30 * DAY_MS;
const MAX_SESSION_AGE_MS = 400 * DAY_MS;
const FUTURE_TOLERANCE_MS = 10 * 60 * 1000;
const ACTIVE_TIME_TOLERANCE_MS = 60 * 1000;
const MAX_FILES_SAVED = 100_000;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const VERSION_RE = /^[0-9A-Za-z.+-]{1,32}$/;

export interface ValidEntry {
	projectId: string;
	/** The developer's local calendar date, YYYY-MM-DD. */
	date: string;
	activeMs: number;
	filesSaved: number;
}

export interface ValidSession {
	clientSessionId: string;
	startedAt: number;
	endedAt: number;
	inactivityTimeoutSeconds: number;
	recovered: boolean;
	clientVersion: string | null;
	entries: ValidEntry[];
}

export type ValidationResult =
	| { ok: true; value: ValidSession }
	| { ok: false; reason: string; clientSessionId: string | null };

function isSafeInt(value: unknown): value is number {
	return typeof value === 'number' && Number.isSafeInteger(value);
}

function isRealDate(value: string): boolean {
	if (!DATE_RE.test(value)) {
		return false;
	}
	const time = Date.parse(`${value}T00:00:00Z`);
	return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value;
}

function utcDate(ms: number): string {
	return new Date(ms).toISOString().slice(0, 10);
}

/** Returns the session id if the raw input contains a usable one, so results can be matched up. */
export function extractClientSessionId(input: unknown): string | null {
	if (typeof input !== 'object' || input === null) {
		return null;
	}
	const id = (input as Record<string, unknown>).clientSessionId;
	return typeof id === 'string' && UUID_RE.test(id) ? id.toLowerCase() : null;
}

export function validateSession(input: unknown, nowMs: number): ValidationResult {
	const clientSessionId = extractClientSessionId(input);
	const fail = (reason: string): ValidationResult => ({ ok: false, reason, clientSessionId });

	if (typeof input !== 'object' || input === null || Array.isArray(input)) {
		return fail('session must be an object');
	}
	const s = input as Record<string, unknown>;

	if (clientSessionId === null) {
		return fail('clientSessionId must be a UUID');
	}

	if (!isSafeInt(s.startedAt) || !isSafeInt(s.endedAt) || s.startedAt <= 0 || s.endedAt <= 0) {
		return fail('startedAt and endedAt must be positive integer timestamps');
	}
	const startedAt = s.startedAt;
	const endedAt = s.endedAt;

	if (endedAt < startedAt) {
		return fail('endedAt is before startedAt');
	}
	if (endedAt - startedAt > MAX_SESSION_LENGTH_MS) {
		return fail('session is longer than 30 days');
	}
	if (endedAt > nowMs + FUTURE_TOLERANCE_MS) {
		return fail('session ends in the future');
	}
	if (startedAt < nowMs - MAX_SESSION_AGE_MS) {
		return fail('session is too old');
	}

	if (!isSafeInt(s.inactivityTimeoutSeconds) || s.inactivityTimeoutSeconds < 30 || s.inactivityTimeoutSeconds > 900) {
		return fail('inactivityTimeoutSeconds must be an integer from 30 to 900');
	}

	if (typeof s.recovered !== 'boolean') {
		return fail('recovered must be true or false');
	}

	let clientVersion: string | null = null;
	if (s.clientVersion !== undefined && s.clientVersion !== null) {
		if (typeof s.clientVersion !== 'string' || !VERSION_RE.test(s.clientVersion)) {
			return fail('clientVersion is not valid');
		}
		clientVersion = s.clientVersion;
	}

	if (!Array.isArray(s.entries) || s.entries.length === 0) {
		return fail('entries must be a non-empty list');
	}
	if (s.entries.length > MAX_ENTRIES_PER_SESSION) {
		return fail('too many entries');
	}

	// Entry dates are the developer's local dates, which can differ from UTC dates by up to a day,
	// so allow two days either side of the session.
	const earliestDate = utcDate(startedAt - 2 * DAY_MS);
	const latestDate = utcDate(endedAt + 2 * DAY_MS);

	const seen = new Set<string>();
	const entries: ValidEntry[] = [];
	let totalActiveMs = 0;

	for (const raw of s.entries) {
		if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
			return fail('each entry must be an object');
		}
		const e = raw as Record<string, unknown>;

		if (typeof e.projectId !== 'string' || !UUID_RE.test(e.projectId)) {
			return fail('entry projectId must be a UUID');
		}
		if (typeof e.date !== 'string' || !isRealDate(e.date)) {
			return fail('entry date must be a real YYYY-MM-DD date');
		}
		if (e.date < earliestDate || e.date > latestDate) {
			return fail('entry date is outside the session period');
		}
		if (!isSafeInt(e.activeMs) || e.activeMs < 0 || e.activeMs > DAY_MS) {
			return fail('entry activeMs must be an integer from 0 to 24 hours');
		}
		if (!isSafeInt(e.filesSaved) || e.filesSaved < 0 || e.filesSaved > MAX_FILES_SAVED) {
			return fail('entry filesSaved is out of range');
		}

		const projectId = e.projectId.toLowerCase();
		const key = `${projectId}|${e.date}`;
		if (seen.has(key)) {
			return fail('duplicate entry for the same project and date');
		}
		seen.add(key);

		// An entry with nothing in it carries no information.
		if (e.activeMs === 0 && e.filesSaved === 0) {
			continue;
		}

		totalActiveMs += e.activeMs;
		entries.push({ projectId, date: e.date, activeMs: e.activeMs, filesSaved: e.filesSaved });
	}

	if (entries.length === 0) {
		return fail('no entry contains any activity');
	}

	// Active time can never exceed the length of the session.
	if (totalActiveMs > endedAt - startedAt + ACTIVE_TIME_TOLERANCE_MS) {
		return fail('active time is longer than the session');
	}

	return {
		ok: true,
		value: {
			clientSessionId,
			startedAt,
			endedAt,
			inactivityTimeoutSeconds: s.inactivityTimeoutSeconds,
			recovered: s.recovered,
			clientVersion,
			entries,
		},
	};
}