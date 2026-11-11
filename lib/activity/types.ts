/** One calendar day of activity (the developer's local date). */
export interface DayPoint {
  date: string; // YYYY-MM-DD
  activeMs: number;
  filesSaved: number;
}

export type Recency = "today" | "this-week" | "earlier" | "none";

export interface WindowTotals {
  last7Ms: number;
  prev7Ms: number;
  last30Ms: number;
  activeDays30: number;
  filesSaved30: number;
}

export interface ProjectRow {
  projectId: string;
  title: string;
  totalMs: number;
  last7Ms: number;
  activeDays: number;
  lastActiveDate: string | null;
}

export interface SessionRow {
  id: string;
  startedAt: string;
  endedAt: string;
  activeMs: number;
  filesSaved: number;
  recovered: boolean;
  projectTitles: string[];
}

export interface HistoryRow {
  date: string;
  activeMs: number;
  filesSaved: number;
  projectCount: number;
}

export interface MyActivityData {
  hasAnyActivity: boolean;
  allTimeMs: number;
  windows: WindowTotals;
  series30: DayPoint[];
  projects: ProjectRow[];
  recentSessions: SessionRow[];
  history: HistoryRow[];
}

export interface ContributorRow {
  userId: string;
  name: string;
  title: string | null;
  avatarUrl: string | null;
  role: string | null;
  totalMs: number;
  last7Ms: number;
  last30Ms: number;
  activeDays: number;
  lastActiveDate: string | null;
  recency: Recency;
}

export interface ProjectActivityData {
  project: { id: string; title: string; logoUrl: string | null };
  /** True when the viewer owns the project and may see the whole team. */
  viewerIsFounder: boolean;
  totalMs: number;
  last7Ms: number;
  last30Ms: number;
  lastActiveDate: string | null;
  rosterSize: number;
  contributorsActiveLast7: number;
  series30: DayPoint[];
  contributors: ContributorRow[];
}

export type ProjectActivityResult =
  | { kind: "not-found" }
  | { kind: "no-access" }
  | { kind: "ok"; data: ProjectActivityData };