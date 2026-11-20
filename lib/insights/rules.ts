import { formatDuration } from "@/lib/activity/format";
import type { Insight, PersonalFacts, ProjectFacts } from "./types";

/**
 * Fixed rules that describe what was RECORDED. They never guess why, never
 * predict, never rank people, and always use neutral wording: no record is
 * not the same as no work.
 */

const MIN = 60_000;
const HOUR = 3_600_000;

/** A change counts as a real change only if it is at least this big in both absolute and relative terms. */
const MIN_CHANGE_MS = 30 * MIN;
const MIN_CHANGE_RATIO = 0.15;

export const QUIET_DAYS = 7;
export const LONG_QUIET_DAYS = 14;

const MILESTONE_HOURS = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000];

function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

function weeklyChange(last7: number, prev7: number, subject: "project" | "personal"): Insight | null {
  if (last7 === 0 && prev7 === 0) return null;

  const who = subject === "project" ? "editor time" : "your editor time";
  const id = "weekly_change";

  if (last7 === 0) {
    return {
      id, kind: "weekly_change", severity: "info",
      title: "No editor time recorded in the last 7 days",
      detail: `${formatDuration(prev7)} was recorded in the 7 days before. Work outside VS Code is not captured.`,
    };
  }

  if (prev7 === 0) {
    return {
      id, kind: "weekly_change", severity: "info",
      title: "Editor activity resumed",
      detail: `${formatDuration(last7)} of ${who} was recorded in the last 7 days, after none in the 7 days before.`,
    };
  }

  const diff = last7 - prev7;
  const ratio = Math.abs(diff) / prev7;

  if (Math.abs(diff) < MIN_CHANGE_MS || ratio < MIN_CHANGE_RATIO) {
    return {
      id, kind: "weekly_change", severity: "info",
      title: "Editor time is steady",
      detail: `${formatDuration(last7)} was recorded in the last 7 days, similar to the ${formatDuration(prev7)} in the 7 days before.`,
    };
  }

  const percent = Math.round(ratio * 100);
  const up = diff > 0;

  return {
    id, kind: "weekly_change", severity: "info",
    title: up ? "Editor time is up" : "Editor time is down",
    detail: `${formatDuration(last7)} was recorded in the last 7 days, ${formatDuration(Math.abs(diff))} ${up ? "more" : "less"} than the ${formatDuration(prev7)} in the 7 days before (${percent}% ${up ? "higher" : "lower"}).${up ? "" : " Time away from VS Code, holidays and non-coding work all affect this."}`,
  };
}

function milestone(totalMs: number, subject: "project" | "personal"): Insight | null {
  const hours = totalMs / HOUR;
  const reached = MILESTONE_HOURS.filter((h) => hours >= h);
  if (reached.length === 0) return null;

  const n = reached[reached.length - 1];
  return {
    id: "milestone",
    kind: "milestone",
    severity: "info",
    title: `${n} hours of editor time recorded`,
    detail: `${subject === "project" ? "The team has" : "You have"} recorded more than ${n} hours of editor time in total.`,
  };
}

export function insightsFromProjectFacts(facts: ProjectFacts): Insight[] {
  const out: Insight[] = [];
  const gh = facts.github;
  const hasGithubRepo = gh !== null && gh.verifiedRepos > 0;

  // Quiet periods, across both sources. Only for projects that have recorded something before.
  const quiet = facts.daysSinceAnyActivity;
  if (quiet !== null && quiet >= QUIET_DAYS) {
    out.push(
      quiet >= LONG_QUIET_DAYS
        ? {
            id: "dormancy", kind: "dormancy", severity: "note",
            title: `No recorded activity for ${quiet} days`,
            detail: `The last recorded editor or GitHub activity was ${quiet} days ago. Work done outside VS Code and public GitHub repositories does not appear here.`,
          }
        : {
            id: "dormancy", kind: "dormancy", severity: "info",
            title: "A quiet week",
            detail: `No editor or GitHub activity has been recorded for ${quiet} days.`,
          }
    );
  }

  const change = weeklyChange(facts.editor.last7Ms, facts.editor.prev7Ms, "project");
  if (change) out.push(change);

  if (facts.team.rosterSize > 1 && facts.hasEditorData) {
    const never = facts.team.neverRecorded;
    out.push({
      id: "participation", kind: "participation", severity: "info",
      title: "Team participation this week",
      detail:
        `${facts.team.activeLast7} of ${facts.team.rosterSize} team members recorded editor time in the last 7 days.` +
        (never > 0
          ? ` ${plural(never, "member has", "members have")} never recorded editor time and may not have set up the tracker yet.`
          : ""),
    });
  }

  if (hasGithubRepo && gh) {
    const w = gh.weeks;
    const weekTotal = w.commitsLast7 + w.commitsPrev7 + w.prsOpenedLast7 + w.prsMergedLast7;

    if (!gh.hasData) {
      out.push({
        id: "github_week", kind: "github_week", severity: "info",
        title: "No GitHub activity in 30 days",
        detail: "A repository is linked, but no commits or pull requests were recorded in the last 30 days. If it was not synced recently, the numbers may be out of date.",
      });
    } else if (weekTotal > 0) {
      out.push({
        id: "github_week", kind: "github_week", severity: "info",
        title: "GitHub this week",
        detail: `${plural(w.commitsLast7, "commit")} in the last 7 days (${w.commitsPrev7} in the 7 days before), ${plural(w.prsOpenedLast7, "pull request")} opened and ${w.prsMergedLast7} merged.`,
      });
    } else {
      out.push({
        id: "github_week", kind: "github_week", severity: "info",
        title: "No GitHub activity in the last 14 days",
        detail: `${plural(gh.commits30, "commit")} ${gh.commits30 === 1 ? "was" : "were"} recorded in the last 30 days, none in the last 14.`,
      });
    }

    const githubThisWeek = w.commitsLast7 + w.prsOpenedLast7 + w.prsMergedLast7;

    if (facts.editor.last7Ms === 0 && w.commitsLast7 > 0) {
      out.push({
        id: "sources_differ", kind: "sources_differ", severity: "info",
        title: "GitHub activity without editor time",
        detail: `${plural(w.commitsLast7, "commit")} ${w.commitsLast7 === 1 ? "was" : "were"} recorded on GitHub in the last 7 days, but no editor time. Work may be happening outside VS Code, or the tracker may not be set up for those contributors.`,
      });
    } else if (facts.editor.last7Ms > 0 && githubThisWeek === 0 && gh.hasData) {
      out.push({
        id: "sources_differ", kind: "sources_differ", severity: "info",
        title: "Editor time without GitHub activity",
        detail: `${formatDuration(facts.editor.last7Ms)} of editor time was recorded in the last 7 days, with no commits or pull requests in the same period. Work in progress does not appear on GitHub until it is committed.`,
      });
    }
  }

  const m = milestone(facts.editor.totalMs, "project");
  if (m) out.push(m);

  return out;
}

export function insightsFromPersonalFacts(facts: PersonalFacts): Insight[] {
  const out: Insight[] = [];

  const change = weeklyChange(facts.editor.last7Ms, facts.editor.prev7Ms, "personal");
  if (change) out.push(change);

  if (facts.hasEditorData) {
    out.push({
      id: "consistency", kind: "consistency", severity: "info",
      title: "Your week at a glance",
      detail: `You recorded editor time on ${facts.editor.activeDaysLast7} of the last 7 days.`,
    });
  }

  const gh = facts.github;
  if (gh && gh.linked) {
    const w = gh.weeks;
    if (w.commitsLast7 + w.commitsPrev7 + w.prsOpenedLast7 + w.prsMergedLast7 > 0) {
      out.push({
        id: "github_week", kind: "github_week", severity: "info",
        title: "Your GitHub this week",
        detail: `${plural(w.commitsLast7, "commit")} in the last 7 days (${w.commitsPrev7} in the 7 days before), ${plural(w.prsOpenedLast7, "pull request")} opened and ${w.prsMergedLast7} merged.`,
      });
    }
  }

  const m = milestone(facts.editor.totalMs, "personal");
  if (m) out.push(m);

  return out;
}