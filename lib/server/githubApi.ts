/**
 * A small, read-only client for the public GitHub REST API. It uses one
 * platform token that can only read public data. `fetch` is passed in so the
 * client can be tested without the network.
 */

export type GitHubErrorKind = "not-found" | "rate-limit" | "unavailable" | "bad-response";

export class GitHubApiError extends Error {
  constructor(
    message: string,
    readonly kind: GitHubErrorKind
  ) {
    super(message);
  }
}

export interface RepoInfo {
  id: number;
  owner: string;
  name: string;
  isPrivate: boolean;
  defaultBranch: string;
}

export interface CommitItem {
  /** When the commit was applied (committer date), ISO 8601. */
  dateIso: string;
  authorId: number | null;
  authorIsBot: boolean;
  parentCount: number;
}

export interface PullItem {
  authorId: number | null;
  authorIsBot: boolean;
  createdAt: string;
  mergedAt: string | null;
  updatedAt: string;
}

export interface Page<T> {
  items: T[];
  truncated: boolean;
}

export interface GitHubApi {
  getRepo(owner: string, name: string): Promise<RepoInfo>;
  getTopics(owner: string, name: string): Promise<string[]>;
  listCommits(owner: string, name: string, sinceIso: string): Promise<Page<CommitItem>>;
  listPulls(owner: string, name: string, sinceIso: string): Promise<Page<PullItem>>;
}

const PER_PAGE = 100;
export const MAX_PAGES = 10;
const ISO_RE = /^\d{4}-\d{2}-\d{2}T/;

type FetchFn = typeof fetch;
type Json = Record<string, unknown>;

function isObject(value: unknown): value is Json {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseUser(value: unknown): { id: number | null; isBot: boolean } {
  if (!isObject(value)) return { id: null, isBot: false };
  const id = typeof value.id === "number" && Number.isSafeInteger(value.id) && value.id > 0 ? value.id : null;
  return { id, isBot: value.type === "Bot" };
}

export function createGitHubApi(fetchFn: FetchFn, token: string): GitHubApi {
  async function get(path: string, query: Record<string, string> = {}): Promise<unknown> {
    const url = new URL(`https://api.github.com${path}`);
    for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);

    let res: Response;
    try {
      res = await fetchFn(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "BuildersAfrica",
        },
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      throw new GitHubApiError("could not reach GitHub", "unavailable");
    }

    if (res.status === 404) throw new GitHubApiError("not found", "not-found");

    if (res.status === 429 || (res.status === 403 && res.headers.get("x-ratelimit-remaining") === "0")) {
      throw new GitHubApiError("rate limited", "rate-limit");
    }

    if (!res.ok) throw new GitHubApiError(`GitHub answered ${res.status}`, "unavailable");

    try {
      return await res.json();
    } catch {
      throw new GitHubApiError("unreadable response", "bad-response");
    }
  }

  return {
    async getRepo(owner, name) {
      const data = await get(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`);

      if (
        !isObject(data) ||
        typeof data.id !== "number" ||
        !Number.isSafeInteger(data.id) ||
        typeof data.private !== "boolean" ||
        typeof data.name !== "string" ||
        !isObject(data.owner) ||
        typeof data.owner.login !== "string"
      ) {
        throw new GitHubApiError("unexpected repository data", "bad-response");
      }

      return {
        id: data.id,
        owner: data.owner.login,
        name: data.name,
        isPrivate: data.private,
        defaultBranch: typeof data.default_branch === "string" ? data.default_branch : "main",
      };
    },

    async getTopics(owner, name) {
      const data = await get(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/topics`);

      if (!isObject(data) || !Array.isArray(data.names)) {
        throw new GitHubApiError("unexpected topics data", "bad-response");
      }

      return data.names.filter((n): n is string => typeof n === "string");
    },

    async listCommits(owner, name, sinceIso) {
      const items: CommitItem[] = [];
      let truncated = false;

      for (let page = 1; page <= MAX_PAGES; page++) {
        const data = await get(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/commits`, {
          since: sinceIso,
          per_page: String(PER_PAGE),
          page: String(page),
        });

        if (!Array.isArray(data)) throw new GitHubApiError("unexpected commits data", "bad-response");

        for (const raw of data) {
          if (!isObject(raw) || !isObject(raw.commit) || !isObject(raw.commit.committer)) continue;
          const date = raw.commit.committer.date;
          if (typeof date !== "string" || !ISO_RE.test(date)) continue;

          const author = parseUser(raw.author);
          items.push({
            dateIso: date,
            authorId: author.id,
            authorIsBot: author.isBot,
            parentCount: Array.isArray(raw.parents) ? raw.parents.length : 1,
          });
        }

        if (data.length < PER_PAGE) break;
        if (page === MAX_PAGES) truncated = true;
      }

      return { items, truncated };
    },

    async listPulls(owner, name, sinceIso) {
      const items: PullItem[] = [];
      let truncated = false;

      for (let page = 1; page <= MAX_PAGES; page++) {
        const data = await get(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/pulls`, {
          state: "all",
          sort: "updated",
          direction: "desc",
          per_page: String(PER_PAGE),
          page: String(page),
        });

        if (!Array.isArray(data)) throw new GitHubApiError("unexpected pull request data", "bad-response");

        let reachedOlder = false;

        for (const raw of data) {
          if (!isObject(raw)) continue;
          const { created_at: createdAt, updated_at: updatedAt, merged_at: mergedAt } = raw;
          if (typeof createdAt !== "string" || !ISO_RE.test(createdAt)) continue;
          if (typeof updatedAt !== "string" || !ISO_RE.test(updatedAt)) continue;

          if (updatedAt < sinceIso) {
            reachedOlder = true;
            continue;
          }

          const author = parseUser(raw.user);
          items.push({
            authorId: author.id,
            authorIsBot: author.isBot,
            createdAt,
            mergedAt: typeof mergedAt === "string" && ISO_RE.test(mergedAt) ? mergedAt : null,
            updatedAt,
          });
        }

        if (reachedOlder || data.length < PER_PAGE) break;
        if (page === MAX_PAGES) truncated = true;
      }

      return { items, truncated };
    },
  };
}