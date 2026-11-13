import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays } from "./dates";
import { classifyRecency } from "./format";
import { fillDailySeries, num, windowTotals } from "./aggregate";
import type {
  ContributorRow,
  HistoryRow,
  MyActivityData,
  ProjectActivityResult,
  ProjectRow,
  SessionRow,
} from "./types";

type Row = Record<string, unknown>;

/**
 * Reads activity through the signed-in user's own session, so the database's
 * row-level security decides what comes back. These functions also filter
 * explicitly, so the page never depends on RLS alone to show the right thing:
 * for example a founder's browser can also read their team's rows, and
 * "My activity" must still show only their own.
 */

async function loadProjectTitles(
  db: SupabaseClient,
  projectIds: string[]
): Promise<Map<string, string>> {
  const titles = new Map<string, string>();
  if (projectIds.length === 0) return titles;

  const { data, error } = await db.from("projects").select("id, title").in("id", projectIds);
  if (error) throw new Error("Could not load project names");

  for (const row of (data ?? []) as Row[]) {
    titles.set(String(row.id), String(row.title));
  }
  return titles;
}

export async function loadMyActivity(
  db: SupabaseClient,
  userId: string,
  todayKey: string
): Promise<MyActivityData> {
  const since = addDays(todayKey, -29);

  const [daily, perProject, sessions] = await Promise.all([
    db
      .from("developer_activity_daily")
      .select("project_id, activity_date, active_ms, files_saved, session_count")
      .eq("user_id", userId)
      .gte("activity_date", since)
      .order("activity_date", { ascending: true }),
    db
      .from("project_member_activity")
      .select("project_id, total_active_ms, active_days, last_active_date")
      .eq("user_id", userId),
    db
      .from("developer_activity_sessions")
      .select("id, started_at, ended_at, recovered")
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(8),
  ]);

  if (daily.error || perProject.error || sessions.error) {
    throw new Error("Could not load your activity");
  }

  const dailyRows = (daily.data ?? []) as Row[];
  const projectRows = (perProject.data ?? []) as Row[];
  const sessionRows = (sessions.data ?? []) as Row[];

  let entryRows: Row[] = [];
  const sessionIds = sessionRows.map((s) => String(s.id));
  if (sessionIds.length > 0) {
    const entries = await db
      .from("developer_activity_entries")
      .select("session_id, project_id, active_ms, files_saved")
      .eq("user_id", userId)
      .in("session_id", sessionIds);

    if (entries.error) throw new Error("Could not load your recent sessions");
    entryRows = (entries.data ?? []) as Row[];
  }

  const projectIds = Array.from(
    new Set([
      ...projectRows.map((r) => String(r.project_id)),
      ...dailyRows.map((r) => String(r.project_id)),
      ...entryRows.map((r) => String(r.project_id)),
    ])
  );
  const titles = await loadProjectTitles(db, projectIds);
  const titleOf = (id: string) => titles.get(id) ?? "Unknown project";

 
   const series30 = fillDailySeries(
   dailyRows.map((r) => ({
    activity_date: String(r.activity_date),
    active_ms: num(r.active_ms),
    files_saved: num(r.files_saved),
    session_count: num(r.session_count),
  })),
  todayKey,
  30
);


  // Last 7 days per project, from the same daily rows.
  const weekStart = addDays(todayKey, -6);
  const last7ByProject = new Map<string, number>();
  for (const r of dailyRows) {
    if (String(r.activity_date) >= weekStart) {
      const id = String(r.project_id);
      last7ByProject.set(id, (last7ByProject.get(id) ?? 0) + num(r.active_ms));
    }
  }

  const projects: ProjectRow[] = projectRows
    .map((r) => ({
      projectId: String(r.project_id),
      title: titleOf(String(r.project_id)),
      totalMs: num(r.total_active_ms),
      last7Ms: last7ByProject.get(String(r.project_id)) ?? 0,
      activeDays: num(r.active_days),
      lastActiveDate: r.last_active_date ? String(r.last_active_date) : null,
    }))
    .sort((a, b) => {
      const byDate = (b.lastActiveDate ?? "").localeCompare(a.lastActiveDate ?? "");
      return byDate !== 0 ? byDate : b.totalMs - a.totalMs;
    });

  // Days with something recorded, newest first.
  const byDate = new Map<string, { activeMs: number; filesSaved: number; projects: Set<string> }>();
  for (const r of dailyRows) {
    const date = String(r.activity_date);
    const entry = byDate.get(date) ?? { activeMs: 0, filesSaved: 0, projects: new Set<string>() };
    entry.activeMs += num(r.active_ms);
    entry.filesSaved += num(r.files_saved);
    if (num(r.active_ms) > 0 || num(r.files_saved) > 0) entry.projects.add(String(r.project_id));
    byDate.set(date, entry);
  }
  const history: HistoryRow[] = Array.from(byDate.entries())
    .filter(([, v]) => v.activeMs > 0 || v.filesSaved > 0)
    .map(([date, v]) => ({
      date,
      activeMs: v.activeMs,
      filesSaved: v.filesSaved,
      projectCount: v.projects.size,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));

  const recentSessions: SessionRow[] = sessionRows.map((s) => {
    const mine = entryRows.filter((e) => String(e.session_id) === String(s.id));
    return {
      id: String(s.id),
      startedAt: String(s.started_at),
      endedAt: String(s.ended_at),
      activeMs: mine.reduce((sum, e) => sum + num(e.active_ms), 0),
      filesSaved: mine.reduce((sum, e) => sum + num(e.files_saved), 0),
      recovered: s.recovered === true,
      projectTitles: Array.from(new Set(mine.map((e) => titleOf(String(e.project_id))))),
    };
  });

  const allTimeMs = projectRows.reduce((sum, r) => sum + num(r.total_active_ms), 0);

  return {
    hasAnyActivity: allTimeMs > 0 || sessionRows.length > 0 || dailyRows.length > 0,
    allTimeMs,
    windows: windowTotals(series30),
    series30,
    projects,
    recentSessions,
    history,
  };
}

export async function loadProjectActivity(
  db: SupabaseClient,
  userId: string,
  projectId: string,
  todayKey: string
): Promise<ProjectActivityResult> {
  const projectRes = await db
    .from("projects")
    .select("id, title, logo_url, user_id")
    .eq("id", projectId)
    .maybeSingle();

  if (projectRes.error) throw new Error("Could not load the project");

  const project = projectRes.data as Row | null;
  if (!project) return { kind: "not-found" };

  const viewerIsFounder = project.user_id === userId;

  if (!viewerIsFounder) {
    const membership = await db
      .from("team_members")
      .select("user_id")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (membership.error) throw new Error("Could not check your access");
    if (!membership.data) return { kind: "no-access" };
  }

  let rosterRows: Row[] = [];
  if (viewerIsFounder) {
    const roster = await db
      .from("team_members")
      .select("user_id, role")
      .eq("project_id", projectId)
      .eq("status", "active");

    if (roster.error) throw new Error("Could not load the team");
    rosterRows = (roster.data ?? []) as Row[];
  }

  const since = addDays(todayKey, -29);

  let memberQuery = db
    .from("project_member_activity")
    .select("user_id, total_active_ms, active_days, last_active_date")
    .eq("project_id", projectId);
  let dailyQuery = db
    .from("developer_activity_daily")
    .select("user_id, activity_date, active_ms, files_saved")
    .eq("project_id", projectId)
    .gte("activity_date", since);

  // Only the founder may see other people's numbers.
  if (!viewerIsFounder) {
    memberQuery = memberQuery.eq("user_id", userId);
    dailyQuery = dailyQuery.eq("user_id", userId);
  }

  const [memberRes, summaryRes, dailyRes] = await Promise.all([
    memberQuery,
    db
      .from("project_activity_summaries")
      .select("total_active_ms, last_active_date")
      .eq("project_id", projectId)
      .maybeSingle(),
    dailyQuery,
  ]);

  if (memberRes.error || summaryRes.error || dailyRes.error) {
    throw new Error("Could not load the project's activity");
  }

  const memberRows = (memberRes.data ?? []) as Row[];
  const dailyRows = (dailyRes.data ?? []) as Row[];
  const summary = summaryRes.data as Row | null;

  const ids = new Set<string>();
  if (viewerIsFounder) {
    ids.add(String(project.user_id));
    for (const r of rosterRows) ids.add(String(r.user_id));
    for (const r of memberRows) ids.add(String(r.user_id));
  } else {
    ids.add(userId);
  }

  const profilesRes = await db
    .from("profiles")
    .select("user_id, full_name, avatar_url, professional_title")
    .in("user_id", Array.from(ids));
  if (profilesRes.error) throw new Error("Could not load names");

  const profiles = new Map<string, Row>();
  for (const p of (profilesRes.data ?? []) as Row[]) profiles.set(String(p.user_id), p);

  const roleOf = new Map<string, string | null>();
  for (const r of rosterRows) roleOf.set(String(r.user_id), r.role ? String(r.role) : null);

  const contributors: ContributorRow[] = Array.from(ids).map((id) => {
    const member = memberRows.find((r) => String(r.user_id) === id);
    const series = fillDailySeries(
      dailyRows
        .filter((r) => String(r.user_id) === id)
        .map((r) => ({
          activity_date: String(r.activity_date),
          active_ms: num(r.active_ms),
          files_saved: num(r.files_saved),
        })),
      todayKey,
      30
    );
    const windows = windowTotals(series);
    const lastActiveDate = member?.last_active_date ? String(member.last_active_date) : null;
    const profile = profiles.get(id);

    return {
      userId: id,
      name: profile?.full_name ? String(profile.full_name) : "Unnamed member",
      title: profile?.professional_title ? String(profile.professional_title) : null,
      avatarUrl: profile?.avatar_url ? String(profile.avatar_url) : null,
      role: id === String(project.user_id) ? "Founder" : (roleOf.get(id) ?? null),
      totalMs: num(member?.total_active_ms),
      last7Ms: windows.last7Ms,
      last30Ms: windows.last30Ms,
      activeDays: num(member?.active_days),
      lastActiveDate,
      recency: classifyRecency(lastActiveDate, todayKey),
    };
  });

  // Founder first, then alphabetical. Deliberately not ranked by activity.
  contributors.sort((a, b) => {
    if (a.role === "Founder" && b.role !== "Founder") return -1;
    if (b.role === "Founder" && a.role !== "Founder") return 1;
    return a.name.localeCompare(b.name);
  });

  const series30 = fillDailySeries(
    dailyRows.map((r) => ({
      activity_date: String(r.activity_date),
      active_ms: num(r.active_ms),
      files_saved: num(r.files_saved),
    })),
    todayKey,
    30
  );
  const teamWindows = windowTotals(series30);

  return {
    kind: "ok",
    data: {
      project: {
        id: String(project.id),
        title: String(project.title),
        logoUrl: project.logo_url ? String(project.logo_url) : null,
      },
      viewerIsFounder,
      totalMs: num(summary?.total_active_ms),
      last7Ms: teamWindows.last7Ms,
      last30Ms: teamWindows.last30Ms,
      lastActiveDate: summary?.last_active_date ? String(summary.last_active_date) : null,
      rosterSize: contributors.length,
      contributorsActiveLast7: contributors.filter((c) => c.last7Ms > 0).length,
      series30,
      contributors,
    },
  };
}