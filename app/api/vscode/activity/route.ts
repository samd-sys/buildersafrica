import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";
import {
  authenticateExtensionToken,
  jsonError,
} from "@/lib/server/extensionAuth";
import { getAuthorizedProjectIds } from "@/lib/server/projectAccess";
import {
  MAX_BODY_CHARS,
  MAX_SESSIONS_PER_REQUEST,
  validateSession,
} from "@/lib/server/activityValidation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ResultStatus = "created" | "updated" | "ignored" | "rejected" | "retry";

interface SessionResult {
  clientSessionId: string | null;
  status: ResultStatus;
  reason?: string;
  droppedEntries?: number;
}

export async function POST(request: Request) {
  // Who is uploading? Only a valid, unexpired, unrevoked extension token passes.
  const auth = await authenticateExtensionToken(request);
  if (!auth) return jsonError("unauthorized", 401);

  const text = await request.text();
  if (text.length > MAX_BODY_CHARS) return jsonError("payload_too_large", 413);

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return jsonError("invalid_body", 400);
  }

  const sessions =
    typeof body === "object" && body !== null
      ? (body as { sessions?: unknown }).sessions
      : undefined;

  if (
    !Array.isArray(sessions) ||
    sessions.length === 0 ||
    sessions.length > MAX_SESSIONS_PER_REQUEST
  ) {
    return jsonError("invalid_sessions", 400);
  }

  const admin = getSupabaseAdmin();

  // Which projects may this user record activity for? Decided here, never by the client.
  let allowedProjects: Set<string>;
  try {
    allowedProjects = await getAuthorizedProjectIds(admin, auth.userId);
  } catch {
    return jsonError("server_error", 500);
  }

  const nowMs = Date.now();
  const results: SessionResult[] = [];
  const seenSessionIds = new Set<string>();

  for (const raw of sessions) {
    const checked = validateSession(raw, nowMs);

    if (!checked.ok) {
      results.push({
        clientSessionId: checked.clientSessionId,
        status: "rejected",
        reason: checked.reason,
      });
      continue;
    }

    const session = checked.value;

    if (seenSessionIds.has(session.clientSessionId)) {
      results.push({
        clientSessionId: session.clientSessionId,
        status: "rejected",
        reason: "the same session appears twice in one request",
      });
      continue;
    }
    seenSessionIds.add(session.clientSessionId);

    // Keep only entries for projects this user is authorized for.
    const kept = session.entries.filter((entry) =>
      allowedProjects.has(entry.projectId)
    );
    const dropped = session.entries.length - kept.length;

    if (kept.length === 0) {
      results.push({
        clientSessionId: session.clientSessionId,
        status: "rejected",
        reason: "none of the projects are ones you can record activity for",
      });
      continue;
    }

    // One atomic database call: create the session, or replace it with a
    // newer copy, together with all of its entries.
    const { data, error } = await admin.rpc("ingest_activity_session", {
      p_user_id: auth.userId,
      p_client_session_id: session.clientSessionId,
      p_started_at: new Date(session.startedAt).toISOString(),
      p_ended_at: new Date(session.endedAt).toISOString(),
      p_timeout_seconds: session.inactivityTimeoutSeconds,
      p_recovered: session.recovered,
      p_client_version: session.clientVersion,
      p_entries: kept.map((entry) => ({
        project_id: entry.projectId,
        activity_date: entry.date,
        active_ms: entry.activeMs,
        files_saved: entry.filesSaved,
      })),
    });

    if (error) {
      // 23503: a referenced project was deleted a moment ago. It will never succeed.
      const permanent = error.code === "23503";
      console.error("activity ingest failed", error.code);
      results.push({
        clientSessionId: session.clientSessionId,
        status: permanent ? "rejected" : "retry",
        reason: permanent ? "a project no longer exists" : undefined,
      });
      continue;
    }

    if (data !== "created" && data !== "updated" && data !== "ignored") {
      console.error("activity ingest returned an unexpected value");
      results.push({ clientSessionId: session.clientSessionId, status: "retry" });
      continue;
    }

    results.push({
      clientSessionId: session.clientSessionId,
      status: data,
      ...(dropped > 0 ? { droppedEntries: dropped } : {}),
    });
  }

  return Response.json({ results });
}