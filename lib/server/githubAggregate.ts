import type { CommitItem, PullItem } from "./githubApi";

export interface DailyRow {
  activity_date: string;
  /** GitHub's numeric user id, or 0 when GitHub could not tell who the author was. */
  github_user_id: number;
  commits: number;
  prs_opened: number;
  prs_merged: number;
}

/**
 * Turns commits and pull requests into daily counts per author.
 *
 * Rules:
 *  - Days are UTC days, as GitHub reports them.
 *  - Bots are left out entirely.
 *  - Merge commits are not counted (the pull request already is), only
 *    ordinary commits, including those from squash and rebase merges.
 *  - A commit counts on the day it was applied (the committer date).
 *  - A pull request counts as "opened" on the day it was created and as
 *    "merged" on the day it was merged, both credited to its author.
 *  - Only days from `sinceDate` to `todayDate` (inclusive) are kept.
 */
export function aggregateActivity(
  commits: readonly CommitItem[],
  pulls: readonly PullItem[],
  sinceDate: string,
  todayDate: string
): DailyRow[] {
  const rows = new Map<string, DailyRow>();

  const bucket = (iso: string, authorId: number | null): DailyRow | null => {
    const date = iso.slice(0, 10);
    if (date < sinceDate || date > todayDate) return null;

    const uid = authorId ?? 0;
    const key = `${date}|${uid}`;
    let row = rows.get(key);
    if (!row) {
      row = { activity_date: date, github_user_id: uid, commits: 0, prs_opened: 0, prs_merged: 0 };
      rows.set(key, row);
    }
    return row;
  };

  for (const commit of commits) {
    if (commit.authorIsBot || commit.parentCount > 1) continue;
    const row = bucket(commit.dateIso, commit.authorId);
    if (row) row.commits++;
  }

  for (const pull of pulls) {
    if (pull.authorIsBot) continue;

    const opened = bucket(pull.createdAt, pull.authorId);
    if (opened) opened.prs_opened++;

    if (pull.mergedAt) {
      const merged = bucket(pull.mergedAt, pull.authorId);
      if (merged) merged.prs_merged++;
    }
  }

  return Array.from(rows.values()).sort(
    (a, b) => a.activity_date.localeCompare(b.activity_date) || a.github_user_id - b.github_user_id
  );
}