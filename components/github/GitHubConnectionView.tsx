import type { ReactNode } from "react";

export interface GitHubAccountInfo {
  login: string;
  linkedAt: string;
}

export type Notice = { kind: "success" | "error" | "info"; text: string };

export type GitHubConnectionState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "error"; message: string }
  | { status: "ready"; account: GitHubAccountInfo | null; notice: Notice | null; busy: boolean };

/** What each result from the GitHub sign-in means, in plain words. */
export function noticeForOutcome(outcome: string | null): Notice | null {
  switch (outcome) {
    case "linked":
      return { kind: "success", text: "Your GitHub account is now connected." };
    case "denied":
      return { kind: "info", text: "You cancelled the connection on GitHub. Nothing was changed." };
    case "already-linked":
      return {
        kind: "error",
        text: "That GitHub account is already connected to a different BuildersAfrica account.",
      };
    case "not-configured":
      return {
        kind: "error",
        text: "GitHub connection is not set up on this server yet.",
      };
    case "invalid":
      return {
        kind: "error",
        text: "The connection could not be confirmed (the link expired or was opened in another browser). Please try again.",
      };
    case "failed":
      return { kind: "error", text: "Something went wrong while talking to GitHub. Please try again." };
    default:
      return null;
  }
}

const NOTICE_STYLES: Record<Notice["kind"], string> = {
  success: "border-emerald-400/20 bg-emerald-400/10 text-emerald-400",
  info: "border-[#00AFEF]/20 bg-[#00AFEF]/10 text-[#00AFEF]",
  error: "border-red-500/20 bg-red-500/10 text-red-400",
};

function Card({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface px-4 py-5 sm:px-6">
      {children}
    </section>
  );
}

export default function GitHubConnectionView({
  state,
  onConnect,
  onDisconnect,
  onRetry,
}: {
  state: GitHubConnectionState;
  onConnect: () => void;
  onDisconnect: () => void;
  onRetry: () => void;
}) {
  if (state.status === "loading") {
    return (
      <div
        aria-busy="true"
        aria-label="Loading GitHub connection"
        className="h-40 animate-pulse rounded-2xl border border-border bg-surface"
      />
    );
  }

  if (state.status === "signed-out") {
    return (
      <Card>
        <p className="text-sm text-muted">Sign in to connect your GitHub account.</p>
      </Card>
    );
  }

  if (state.status === "error") {
    return (
      <Card>
        <p className="text-sm text-red-400">{state.message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:border-[#00AFEF]/40"
        >
          Try again
        </button>
      </Card>
    );
  }

  const { account, notice, busy } = state;

  return (
    <div className="space-y-4">
      {notice && (
        <div
          role="status"
          className={`rounded-2xl border px-4 py-3 text-sm ${NOTICE_STYLES[notice.kind]}`}
        >
          {notice.text}
        </div>
      )}

      <Card>
        <h2 className="text-base font-semibold text-foreground">GitHub account</h2>

        {account ? (
          <div className="mt-3 space-y-3">
            <p className="text-sm text-foreground">
              Connected as{" "}
              <a
                href={`https://github.com/${account.login}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#00AFEF] hover:underline"
              >
                @{account.login}
              </a>
            </p>
            <p className="text-xs text-muted">
              Connected on {new Date(account.linkedAt).toLocaleDateString()}
            </p>
            <button
              type="button"
              onClick={onDisconnect}
              disabled={busy}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:border-red-500/40 disabled:opacity-50"
            >
              {busy ? "Working..." : "Disconnect GitHub"}
            </button>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <p className="text-sm text-muted">No GitHub account is connected yet.</p>
            <button
              type="button"
              onClick={onConnect}
              disabled={busy}
              className="rounded-lg bg-[#00AFEF] px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
            >
              {busy ? "Opening GitHub..." : "Connect GitHub"}
            </button>
          </div>
        )}
      </Card>

      <div
        role="note"
        className="space-y-2 rounded-2xl border border-[#00AFEF]/20 bg-[#00AFEF]/5 px-4 py-4 text-sm text-muted sm:px-5"
      >
        <p>
          <strong className="text-foreground">Why connect:</strong> connecting proves the GitHub
          account is yours. In a later step, commits and pull requests in repositories linked to
          your projects can be counted for you. This is what makes GitHub activity attributable
          to the right person, which a typed profile link cannot do.
        </p>
        <p>
          <strong className="text-foreground">What is stored:</strong> only your GitHub username
          and numeric id. BuildersAfrica never receives your GitHub password. The sign-in is used
          once to read your public username and is then cancelled, so no access to your GitHub
          account is kept.
        </p>
        <p>You can disconnect at any time.</p>
      </div>
    </div>
  );
}