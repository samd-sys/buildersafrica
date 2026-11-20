import { aggregateActivity, type DailyRow } from "./githubAggregate";
import { GitHubApiError, type GitHubApi, type RepoInfo } from "./githubApi";

export const SYNC_WINDOW_DAYS = 30;
export const SYNC_COOLDOWN_MS = 5 * 60 * 1000;

export interface SyncOutcome {
  rows: DailyRow[];
  /** First day (UTC) that these rows replace. */
  since: string;
  /** A plain-words note about the sync, or null when everything is normal. */
  note: string | null;
  repo: RepoInfo;
}

function utcDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * Collects the last 30 days of activity for one repository.
 * Throws GitHubApiError("not-found") when the repository is gone, private,
 * or is no longer the repository that was verified.
 */
export async function collectRepositoryActivity(
  api: GitHubApi,
  repo: { owner: string; name: string; githubRepoId: number },
  nowMs: number
): Promise<SyncOutcome> {
  const info = await api.getRepo(repo.owner, repo.name);

  if (info.isPrivate || info.id !== repo.githubRepoId) {
    throw new GitHubApiError("repository is not available", "not-found");
  }

  const since = utcDate(nowMs - (SYNC_WINDOW_DAYS - 1) * 86_400_000);
  const today = utcDate(nowMs);
  const sinceIso = `${since}T00:00:00Z`;

  const [commits, pulls] = await Promise.all([
    api.listCommits(info.owner, info.name, sinceIso),
    api.listPulls(info.owner, info.name, sinceIso),
  ]);

  const rows = aggregateActivity(commits.items, pulls.items, since, today);

  return {
    rows,
    since,
    note:
      commits.truncated || pulls.truncated
        ? "This repository has a very large amount of activity. Counts may be incomplete."
        : null,
    repo: info,
  };
}