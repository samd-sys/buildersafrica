"use client";

import { useState, type ChangeEvent, type ReactNode } from "react";

export interface RepoRow {
  id: string;
  fullName: string;
  status: "pending" | "verified" | "unavailable";
  verificationCode: string | null;
  lastSyncedAt: string | null;
  lastSyncNote: string | null;
}

export type RepoNotice = { kind: "success" | "error" | "info"; text: string };

export type ReposState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      repos: RepoRow[];
      busyId: string | null;
      adding: boolean;
      notice: RepoNotice | null;
    };

/** Plain-words messages for the codes the server can answer with. */
export function messageForError(code: string | null, extra?: { retryAfterSeconds?: number }): string {
  switch (code) {
    case "invalid_repo":
      return "Enter a repository as owner/name, or paste its GitHub address.";
    case "repo_not_found_or_private":
      return "We could not find a public repository with that name.";
    case "repo_is_private":
      return "That repository is private. Only public repositories are supported for now.";
    case "already_linked":
      return "That repository is already linked to this project.";
    case "too_many_repositories":
      return "A project can have up to 5 linked repositories.";
    case "forbidden":
      return "Only the project founder can manage linked repositories.";
    case "github_sync_not_configured":
      return "Repository syncing is not set up on this server yet.";
    case "github_rate_limited":
      return "GitHub is limiting requests right now. Please try again in a few minutes.";
    case "github_unavailable":
      return "GitHub could not be reached. Please try again.";
    case "topic_missing":
      return "We could not find the topic yet. Add it on GitHub, wait a few seconds, then try again.";
    case "repo_not_available":
    case "repo_unavailable":
      return "That repository is no longer available (it may be private, deleted or transferred).";
    case "too_soon": {
      const minutes = Math.max(1, Math.ceil((extra?.retryAfterSeconds ?? 60) / 60));
      return `This repository was synced a moment ago. Please wait about ${minutes} minute${minutes === 1 ? "" : "s"}.`;
    }
    default:
      return "Something went wrong. Please try again.";
  }
}

const NOTICE_STYLES: Record<RepoNotice["kind"], string> = {
  success: "border-emerald-400/20 bg-emerald-400/10 text-emerald-400",
  info: "border-[#00AFEF]/20 bg-[#00AFEF]/10 text-[#00AFEF]",
  error: "border-red-500/20 bg-red-500/10 text-red-400",
};

const STATUS_LABEL: Record<RepoRow["status"], string> = {
  pending: "Waiting for verification",
  verified: "Verified",
  unavailable: "Unavailable",
};

function Shell({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface px-4 py-5 sm:px-6">
      <div className="mb-4 space-y-1">
        <h2 className="text-base font-semibold text-foreground">GitHub repositories</h2>
        <p className="text-xs text-muted">
          Link public repositories so commits and pull requests can be shown next to editor
          activity. Only daily counts are stored, never code, messages or titles.
        </p>
      </div>
      {children}
    </section>
  );
}

export default function GitHubReposView({
  state,
  onAdd,
  onVerify,
  onSync,
  onRemove,
  onRetry,
}: {
  state: ReposState;
  onAdd: (input: string) => void;
  onVerify: (id: string) => void;
  onSync: (id: string) => void;
  onRemove: (id: string) => void;
  onRetry: () => void;
}) {
  const [input, setInput] = useState("");

  if (state.status === "loading") {
    return (
      <div
        aria-busy="true"
        aria-label="Loading repositories"
        className="h-32 animate-pulse rounded-2xl border border-border bg-surface"
      />
    );
  }

  if (state.status === "error") {
    return (
      <Shell>
        <p className="text-sm text-red-400">{state.message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:border-[#00AFEF]/40"
        >
          Try again
        </button>
      </Shell>
    );
  }

  return (
    <Shell>
      {state.notice && (
        <div
          role="status"
          className={`mb-4 rounded-xl border px-4 py-3 text-sm ${NOTICE_STYLES[state.notice.kind]}`}
        >
          {state.notice.text}
        </div>
      )}

      {state.repos.length === 0 ? (
        <p className="mb-4 text-sm text-muted">No repositories are linked to this project yet.</p>
      ) : (
        <ul className="mb-5 divide-y divide-border/60">
          {state.repos.map((repo) => {
            const busy = state.busyId === repo.id;

            return (
              <li key={repo.id} className="space-y-2 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <a
                    href={`https://github.com/${repo.fullName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-[#00AFEF] hover:underline"
                  >
                    {repo.fullName}
                  </a>
                  <span className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-muted">
                    {STATUS_LABEL[repo.status]}
                  </span>
                </div>

                {repo.status === "pending" && (
                  <div className="space-y-2 text-sm text-muted">
                    <p>
                      To prove you control this repository, add this topic to it on GitHub
                      (repository page, then the gear icon next to &quot;About&quot;, then
                      Topics):
                    </p>
                    <code className="block w-fit rounded-lg border border-border bg-surface-secondary px-3 py-1.5 text-xs text-foreground">
                      {repo.verificationCode}
                    </code>
                    <p>Then click Verify. You can remove the topic afterwards.</p>
                  </div>
                )}

                {repo.status === "verified" && (
                  <p className="text-xs text-muted">
                    {repo.lastSyncedAt
                      ? `Last synced ${new Date(repo.lastSyncedAt).toLocaleString()}`
                      : "Not synced yet."}
                    {repo.lastSyncNote ? ` ${repo.lastSyncNote}` : ""}
                  </p>
                )}

                {repo.status === "unavailable" && (
                  <p className="text-xs text-muted">
                    {repo.lastSyncNote ?? "This repository is no longer available."}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  {repo.status === "pending" && (
                    <button
                      type="button"
                      onClick={() => onVerify(repo.id)}
                      disabled={busy}
                      className="rounded-lg bg-[#00AFEF] px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
                    >
                      {busy ? "Checking..." : "Verify"}
                    </button>
                  )}
                  {repo.status === "verified" && (
                    <button
                      type="button"
                      onClick={() => onSync(repo.id)}
                      disabled={busy}
                      className="rounded-lg bg-[#00AFEF] px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
                    >
                      {busy ? "Syncing..." : "Sync now"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemove(repo.id)}
                    disabled={busy}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:border-red-500/40 hover:text-foreground disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="space-y-2">
        <label htmlFor="repo-input" className="text-xs font-medium uppercase tracking-wider text-muted">
          Add a public repository
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="repo-input"
            type="text"
            value={input}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setInput(event.target.value)}
            placeholder="owner/repository or https://github.com/owner/repository"
            className="min-w-0 flex-1 rounded-lg border border-border bg-surface-secondary px-3 py-2 text-sm text-foreground outline-none focus:border-[#00AFEF]/50"
          />
          <button
            type="button"
            onClick={() => {
              onAdd(input);
              setInput("");
            }}
            disabled={state.adding || input.trim().length === 0}
            className="rounded-lg bg-[#00AFEF] px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
          >
            {state.adding ? "Adding..." : "Add"}
          </button>
        </div>
        <p className="text-xs text-muted">
          Only public repositories are supported. Counts cover the last 30 days (UTC days):
          commits on the default branch, and pull requests opened and merged. Bots and merge
          commits are not counted.
        </p>
      </div>
    </Shell>
  );
}