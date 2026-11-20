import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays } from "./dates";
import { num } from "./aggregate";

/**
 * GitHub activity for the dashboards. It is a SEPARATE source from editor
 * activity and is never added to it. GitHub days are UTC days.
 */

export interface GithubDayRow {
  activity_date: string;
  /** The BuildersAfrica user, or null for contributors who are not identified. */
  user_id: string | null;
  commits: number;
  prs_opened: number;
  prs_merged: number;
}

export interface CountPoint {
  date: string;
  count: number;
}

export interface GithubTotals {
  commits: number;
  prsOpened: number;
  prsMerged: number;
}

export interface GithubPerson {
  userId: string | null;
  totals: GithubTotals;
  /** The latest UTC day with any GitHub activity, or null. */
  lastDate: string | null;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type Row = Record<string, unknown>;

/** Keeps only well-formed rows and turns the numbers into real numbers. */
export function parseGithubRows(data: unknown): GithubDayRow[] {
  if (!Array.isArray(data)) return [];

  const rows: GithubDayRow[] = [];
  for (const raw of data as Row[]) {
    if (typeof raw !== "object" || raw === null) continue;
    const date = typeof raw.activity_date === "string" ? raw.activity_date.slice(0, 10) : "";
    if (!DATE_RE.test(date)) continue;

    rows.push({
      activity_date: date,
      user_id: typeof raw.user_id === "string" ? raw.user_id : null,
      commits: Math.max(0, num(raw.commits)),
      prs_opened: Math.max(0, num(raw.prs_opened)),
      prs_merged: Math.max(0, num(raw.prs_merged)),
    });
  }
  return rows;
}

export function sumTotals(rows: readonly GithubDayRow[]): GithubTotals {
  return rows.reduce<GithubTotals>(
    (t, r) => ({
      commits: t.commits + r.commits,
      prsOpened: t.prsOpened + r.prs_opened,
      prsMerged: t.prsMerged + r.prs_merged,
    }),
    { commits: 0, prsOpened: 0, prsMerged: 0 }
  );
}

/** One point per day for the last `days` days ending today (UTC), oldest first. */
export function fillCountSeries(
  rows: readonly GithubDayRow[],
  field: "commits" | "prs_opened" | "prs_merged",
  todayUtc: string,
  days = 30
): CountPoint[] {
  const byDate = new Map<string, number>();
  for (const row of rows) byDate.set(row.activity_date, (byDate.get(row.activity_date) ?? 0) + row[field]);

  const series: CountPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(todayUtc, -i);
    series.push({ date, count: byDate.get(date) ?? 0 });
  }
  return series;
}

/** Totals per person. Unidentified contributors form one group with userId null. */
export function groupPeople(rows: readonly GithubDayRow[]): GithubPerson[] {
  const people = new Map<string, GithubPerson>();

  for (const row of rows) {
    const key = row.user_id ?? "";
    const person = people.get(key) ?? {
      userId: row.user_id,
      totals: { commits: 0, prsOpened: 0, prsMerged: 0 },
      lastDate: null,
    };

    person.totals.commits += row.commits;
    person.totals.prsOpened += row.prs_opened;
    person.totals.prsMerged += row.prs_merged;

    if (row.commits + row.prs_opened + row.prs_merged > 0) {
      if (person.lastDate === null || row.activity_date > person.lastDate) person.lastDate = row.activity_date;
    }

    people.set(key, person);
  }

  return Array.from(people.values());
}

export interface GithubWeeks {
  commitsLast7: number;
  commitsPrev7: number;
  prsOpenedLast7: number;
  prsOpenedPrev7: number;
  prsMergedLast7: number;
  prsMergedPrev7: number;
}

/** Counts for the last 7 UTC days and the 7 days before them. */
export function weeklyGithub(rows: readonly GithubDayRow[], todayUtc: string): GithubWeeks {
  const lastStart = addDays(todayUtc, -6);
  const prevStart = addDays(todayUtc, -13);
  const prevEnd = addDays(todayUtc, -7);

  const weeks: GithubWeeks = {
    commitsLast7: 0, commitsPrev7: 0,
    prsOpenedLast7: 0, prsOpenedPrev7: 0,
    prsMergedLast7: 0, prsMergedPrev7: 0,
  };

  for (const row of rows) {
    if (row.activity_date >= lastStart && row.activity_date <= todayUtc) {
      weeks.commitsLast7 += row.commits;
      weeks.prsOpenedLast7 += row.prs_opened;
      weeks.prsMergedLast7 += row.prs_merged;
    } else if (row.activity_date >= prevStart && row.activity_date <= prevEnd) {
      weeks.commitsPrev7 += row.commits;
      weeks.prsOpenedPrev7 += row.prs_opened;
      weeks.prsMergedPrev7 += row.prs_merged;
    }
  }

  return weeks;
}

// ---------- project ----------

export interface ProjectGithubData {
  repos: { total: number; verified: number; lastSyncedAt: string | null };
  /** Whether the viewer has connected their own GitHub account. */
  viewerLinked: boolean;
  totals: GithubTotals;
  weeks: GithubWeeks;
  series: CountPoint[];
  people: GithubPerson[];
  hasActivity: boolean;
}

export async function loadProjectGithub(
  db: SupabaseClient,
  userId: string,
  projectId: string,
  todayUtc: string
): Promise<ProjectGithubData> {
  const since = addDays(todayUtc, -29);

  const [repos, link, activity] = await Promise.all([
    db.from("project_repositories").select("id, status, last_synced_at").eq("project_id", projectId),
    db.from("github_accounts").select("github_user_id").eq("user_id", userId).maybeSingle(),
    db.rpc("get_project_github_activity", { p_project_id: projectId, p_since: since }),
  ]);

  if (repos.error || link.error || activity.error) {
    throw new Error("Could not load GitHub activity");
  }

  const repoRows = (repos.data ?? []) as Row[];
  const verified = repoRows.filter((r) => r.status === "verified");
  const synced = verified
    .map((r) => (typeof r.last_synced_at === "string" ? r.last_synced_at : null))
    .filter((v): v is string => v !== null)
    .sort();

  const rows = parseGithubRows(activity.data);

  return {
    repos: {
      total: repoRows.length,
      verified: verified.length,
      lastSyncedAt: synced.length > 0 ? synced[synced.length - 1] : null,
    },
    viewerLinked: link.data !== null,
    totals: sumTotals(rows),
    weeks: weeklyGithub(rows, todayUtc),
    series: fillCountSeries(rows, "commits", todayUtc),
    people: groupPeople(rows),
    hasActivity: rows.some((r) => r.commits + r.prs_opened + r.prs_merged > 0),
  };
}

// ---------- my activity across projects ----------

export interface MyGithubProject {
  projectId: string;
  title: string;
  totals: GithubTotals;
  lastDate: string | null;
}

export interface MyGithubData {
  linked: boolean;
  login: string | null;
  totals: GithubTotals;
  weeks: GithubWeeks;
  series: CountPoint[];
  projects: MyGithubProject[];
  hasActivity: boolean;
}

export async function loadMyGithub(
  db: SupabaseClient,
  userId: string,
  todayUtc: string
): Promise<MyGithubData> {
  const since = addDays(todayUtc, -29);

  const [link, activity] = await Promise.all([
    db.from("github_accounts").select("github_login").eq("user_id", userId).maybeSingle(),
    db.rpc("get_my_github_activity", { p_since: since }),
  ]);

  if (link.error || activity.error) throw new Error("Could not load your GitHub activity");

  const raw = Array.isArray(activity.data) ? (activity.data as Row[]) : [];
  const rows = parseGithubRows(raw);

  const projectIds = Array.from(
    new Set(raw.map((r) => (typeof r.project_id === "string" ? r.project_id : "")).filter(Boolean))
  );

  const titles = new Map<string, string>();
  if (projectIds.length > 0) {
    const { data, error } = await db.from("projects").select("id, title").in("id", projectIds);
    if (error) throw new Error("Could not load project names");
    for (const p of (data ?? []) as Row[]) titles.set(String(p.id), String(p.title));
  }

  const byProject = new Map<string, MyGithubProject>();
  for (const r of raw) {
    const projectId = typeof r.project_id === "string" ? r.project_id : "";
    const date = typeof r.activity_date === "string" ? r.activity_date.slice(0, 10) : "";
    if (!projectId || !DATE_RE.test(date)) continue;

    const entry = byProject.get(projectId) ?? {
      projectId,
      title: titles.get(projectId) ?? "Unknown project",
      totals: { commits: 0, prsOpened: 0, prsMerged: 0 },
      lastDate: null,
    };
    const commits = Math.max(0, num(r.commits));
    const opened = Math.max(0, num(r.prs_opened));
    const merged = Math.max(0, num(r.prs_merged));
    entry.totals.commits += commits;
    entry.totals.prsOpened += opened;
    entry.totals.prsMerged += merged;
    if (commits + opened + merged > 0 && (entry.lastDate === null || date > entry.lastDate)) entry.lastDate = date;
    byProject.set(projectId, entry);
  }

  const projects = Array.from(byProject.values()).sort(
    (a, b) => (b.lastDate ?? "").localeCompare(a.lastDate ?? "") || a.title.localeCompare(b.title)
  );

  return {
    linked: link.data !== null,
    login: link.data && typeof (link.data as Row).github_login === "string" ? String((link.data as Row).github_login) : null,
    totals: sumTotals(rows),
    weeks: weeklyGithub(rows, todayUtc),
    series: fillCountSeries(rows, "commits", todayUtc),
    projects,
    hasActivity: rows.some((r) => r.commits + r.prs_opened + r.prs_merged > 0),
  };
}