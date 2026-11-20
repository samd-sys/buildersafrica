import type { GithubWeeks } from "@/lib/activity/github";

export type InsightKind =
  | "weekly_change"
  | "participation"
  | "dormancy"
  | "github_week"
  | "sources_differ"
  | "consistency"
  | "milestone";

/** "note" is for things worth a look; it is never a warning or a judgement. */
export type InsightSeverity = "info" | "note";

export interface Insight {
  id: string;
  kind: InsightKind;
  severity: InsightSeverity;
  title: string;
  detail: string;
}

/**
 * Everything the rules (and, later, the AI summary) are allowed to know about
 * a project: numbers and dates only. No names, titles, messages or code.
 */
export interface ProjectFacts {
  hasEditorData: boolean;
  editor: {
    last7Ms: number;
    prev7Ms: number;
    last30Ms: number;
    totalMs: number;
    lastActiveDate: string | null;
    daysSinceLastActive: number | null;
  };
  team: {
    rosterSize: number;
    activeLast7: number;
    activeLast30: number;
    neverRecorded: number;
  };
  github: null | {
    verifiedRepos: number;
    hasData: boolean;
    weeks: GithubWeeks;
    commits30: number;
    lastActivityDate: string | null;
    daysSinceLastActivity: number | null;
  };
  /** Days since the most recent editor OR GitHub activity, or null when nothing was ever recorded. */
  daysSinceAnyActivity: number | null;
}

export interface PersonalFacts {
  hasEditorData: boolean;
  editor: {
    last7Ms: number;
    prev7Ms: number;
    last30Ms: number;
    totalMs: number;
    activeDaysLast7: number;
  };
  github: null | {
    linked: boolean;
    hasData: boolean;
    weeks: GithubWeeks;
  };
}