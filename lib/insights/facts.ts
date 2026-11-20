import { daysBetween } from "@/lib/activity/dates";
import { windowTotals } from "@/lib/activity/aggregate";
import type { MyGithubData, ProjectGithubData } from "@/lib/activity/github";
import type { MyActivityData, ProjectActivityData } from "@/lib/activity/types";
import type { PersonalFacts, ProjectFacts } from "./types";

function daysSince(date: string | null, today: string): number | null {
  if (!date) return null;
  return Math.max(0, daysBetween(date, today));
}

function latest(dates: Array<string | null>): string | null {
  const present = dates.filter((d): d is string => d !== null).sort();
  return present.length > 0 ? present[present.length - 1] : null;
}

/** Turns the project dashboard data into plain facts. Only numbers and dates. */
export function computeProjectFacts(
  activity: ProjectActivityData,
  github: ProjectGithubData | null,
  todayKey: string,
  todayUtc: string
): ProjectFacts {
  const windows = windowTotals(activity.series30);
  const daysSinceLastActive = daysSince(activity.lastActiveDate, todayKey);

  let githubFacts: ProjectFacts["github"] = null;
  if (github) {
    const lastActivityDate = latest(github.people.map((p) => p.lastDate));
    githubFacts = {
      verifiedRepos: github.repos.verified,
      hasData: github.hasActivity,
      weeks: github.weeks,
      commits30: github.totals.commits,
      lastActivityDate,
      daysSinceLastActivity: daysSince(lastActivityDate, todayUtc),
    };
  }

  const since = [daysSinceLastActive, githubFacts?.daysSinceLastActivity ?? null].filter(
    (d): d is number => d !== null
  );

  return {
    hasEditorData: activity.totalMs > 0,
    editor: {
      last7Ms: windows.last7Ms,
      prev7Ms: windows.prev7Ms,
      last30Ms: windows.last30Ms,
      totalMs: activity.totalMs,
      lastActiveDate: activity.lastActiveDate,
      daysSinceLastActive,
    },
    team: {
      rosterSize: activity.rosterSize,
      activeLast7: activity.contributorsActiveLast7,
      activeLast30: activity.contributors.filter((c) => c.last30Ms > 0).length,
      neverRecorded: activity.contributors.filter((c) => c.totalMs === 0).length,
    },
    github: githubFacts,
    daysSinceAnyActivity: since.length > 0 ? Math.min(...since) : null,
  };
}

export function computePersonalFacts(
  mine: MyActivityData,
  github: MyGithubData | null
): PersonalFacts {
  return {
    hasEditorData: mine.allTimeMs > 0,
    editor: {
      last7Ms: mine.windows.last7Ms,
      prev7Ms: mine.windows.prev7Ms,
      last30Ms: mine.windows.last30Ms,
      totalMs: mine.allTimeMs,
      activeDaysLast7: mine.series30.slice(-7).filter((p) => p.activeMs > 0).length,
    },
    github: github ? { linked: github.linked, hasData: github.hasActivity, weeks: github.weeks } : null,
  };
}