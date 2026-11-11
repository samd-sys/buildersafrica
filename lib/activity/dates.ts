/**
 * Calendar-date helpers. Dates are plain "YYYY-MM-DD" strings (the
 * developer's local calendar day). All arithmetic is done in UTC on the
 * date parts, so daylight-saving changes can never shift a day.
 */

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isDateKey(value: string): boolean {
  const match = DATE_RE.exec(value);
  if (!match) return false;
  const [, y, m, d] = match;
  const time = Date.UTC(Number(y), Number(m) - 1, Number(d));
  return toKeyFromUtc(time) === value;
}

function toKeyFromUtc(time: number): string {
  const date = new Date(time);
  const y = String(date.getUTCFullYear()).padStart(4, "0");
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** The viewer's local calendar date for a moment in time. */
export function toDateKey(date: Date): string {
  const y = String(date.getFullYear()).padStart(4, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(key: string, days: number): string {
  const match = DATE_RE.exec(key);
  if (!match) {
    throw new Error(`Not a date key: ${key}`);
  }
  const [, y, m, d] = match;
  return toKeyFromUtc(Date.UTC(Number(y), Number(m) - 1, Number(d) + days));
}

/** Whole days from one date to another (positive when `to` is later). */
export function daysBetween(fromKey: string, toKey: string): number {
  const a = DATE_RE.exec(fromKey);
  const b = DATE_RE.exec(toKey);
  if (!a || !b) {
    throw new Error("Not a date key");
  }
  const from = Date.UTC(Number(a[1]), Number(a[2]) - 1, Number(a[3]));
  const to = Date.UTC(Number(b[1]), Number(b[2]) - 1, Number(b[3]));
  return Math.round((to - from) / 86_400_000);
}