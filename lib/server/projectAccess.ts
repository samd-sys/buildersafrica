import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The ids of every project this user is allowed to record activity for:
 * projects they own, plus projects where they are an ACTIVE team member.
 *
 * This is the same rule used by GET /api/vscode/projects. It is checked on
 * the server for every upload, so a modified extension cannot record
 * activity against someone else's project.
 */
export async function getAuthorizedProjectIds(
  admin: SupabaseClient,
  userId: string
): Promise<Set<string>> {
  const [owned, memberships] = await Promise.all([
    admin.from("projects").select("id").eq("user_id", userId),
    admin
      .from("team_members")
      .select("project_id")
      .eq("user_id", userId)
      .eq("status", "active"),
  ]);

  if (owned.error || memberships.error) {
    throw new Error("Could not look up the user's projects");
  }

  const ids = new Set<string>();
  for (const row of owned.data ?? []) {
    ids.add(String(row.id).toLowerCase());
  }
  for (const row of memberships.data ?? []) {
    ids.add(String(row.project_id).toLowerCase());
  }

  return ids;
}