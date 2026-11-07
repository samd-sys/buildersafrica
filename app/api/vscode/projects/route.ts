import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";
import {
  authenticateExtensionToken,
  jsonError,
} from "@/lib/server/extensionAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProjectRow = {
  id: string;
  title: string;
  category: string | null;
  stage: string | null;
  logo_url: string | null;
};

export async function GET(request: Request) {
  const auth = await authenticateExtensionToken(request);
  if (!auth) return jsonError("unauthorized", 401);

  const admin = getSupabaseAdmin();
  const columns = "id, title, category, stage, logo_url";

  // 1) Projects the user owns.
  const { data: owned, error: ownedError } = await admin
    .from("projects")
    .select(columns)
    .eq("user_id", auth.userId);

  if (ownedError) return jsonError("server_error", 500);

  // 2) Projects where the user is an active team member.
  const { data: memberships, error: memberError } = await admin
    .from("team_members")
    .select("project_id, role")
    .eq("user_id", auth.userId)
    .eq("status", "active");

  if (memberError) return jsonError("server_error", 500);

  const ownedIds = new Set((owned ?? []).map((p) => p.id as string));
  const memberRoleByProject = new Map<string, string | null>();
  for (const m of memberships ?? []) {
    if (!ownedIds.has(m.project_id as string)) {
      memberRoleByProject.set(m.project_id as string, (m.role as string) ?? null);
    }
  }

  let memberProjects: ProjectRow[] = [];
  if (memberRoleByProject.size > 0) {
    const { data, error } = await admin
      .from("projects")
      .select(columns)
      .in("id", Array.from(memberRoleByProject.keys()));
    if (error) return jsonError("server_error", 500);
    memberProjects = (data ?? []) as ProjectRow[];
  }

  const projects = [
    ...((owned ?? []) as ProjectRow[]).map((p) => ({
      ...p,
      relationship: "owner" as const,
      role: "Founder",
    })),
    ...memberProjects.map((p) => ({
      ...p,
      relationship: "member" as const,
      role: memberRoleByProject.get(p.id) ?? null,
    })),
  ].sort((a, b) => a.title.localeCompare(b.title));

  return Response.json({ projects });
}