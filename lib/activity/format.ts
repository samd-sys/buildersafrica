import { daysBetween } from "./dates";
import type { Recency } from "./types";

/** "2h 5m", "25m", "<1m" or "0m". Never shows seconds: this is a participation signal, not a stopwatch. */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "0m";

  const totalMinutes = Math.floor(ms / 60_000);
  if (totalMinutes < 1) return "<1m";

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

/** "+1h 5m", "-20m" or "no change", for comparing two periods. */
export function formatDelta(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  if (minutes === 0) return "no change";
  const sign = minutes > 0 ? "+" : "-";
  return `${sign}${formatDuration(Math.abs(minutes) * 60_000)}`;
}

/** "Mon 3 Nov" for a YYYY-MM-DD date key. */
export function formatDayLabel(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function classifyRecency(lastActiveDate: string | null, todayKey: string): Recency {
  if (!lastActiveDate) return "none";
  const age = daysBetween(lastActiveDate, todayKey);
  if (age <= 0) return "today";
  if (age <= 6) return "this-week";
  return "earlier";
}

/** Neutral wording on purpose: no record is not the same as no work. */
export function describeRecency(lastActiveDate: string | null, todayKey: string): string {
  if (!lastActiveDate) return "No activity recorded";
  const age = daysBetween(lastActiveDate, todayKey);
  if (age <= 0) return "Today";
  if (age === 1) return "Yesterday";
  return `${age} days ago`;
}