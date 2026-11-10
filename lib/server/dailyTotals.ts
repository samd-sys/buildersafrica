import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * How much active time this user already has stored for each of the given
 * dates, counting every session EXCEPT the one being uploaded (an upload of
 * the same session replaces its earlier copy, so that copy must not count).
 *
 * Used to apply the daily limit before anything is written.
 */
export async function getOtherSessionsDailyTotals(
  admin: SupabaseClient,
  userId: string,
  clientSessionId: string,
  dates: string[]
): Promise<Map<string, number>> {
  const totals = new Map<string, number>();

  if (dates.length === 0) {
    return totals;
  }

  const { data: existing, error: sessionError } = await admin
    .from("developer_activity_sessions")
    .select("id")
    .eq("user_id", userId)
    .eq("client_session_id", clientSessionId)
    .maybeSingle();

  if (sessionError) {
    throw new Error("Could not look up the existing session");
  }

  let query = admin
    .from("developer_activity_entries")
    .select("activity_date, active_ms")
    .eq("user_id", userId)
    .in("activity_date", dates);

  if (existing) {
    query = query.neq("session_id", existing.id);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Could not look up existing daily totals");
  }

  for (const row of data ?? []) {
    const date = String(row.activity_date);
    totals.set(date, (totals.get(date) ?? 0) + Number(row.active_ms));
  }

  return totals;
}