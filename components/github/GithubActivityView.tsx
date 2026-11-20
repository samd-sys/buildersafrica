import Link from "next/link";
import { describeRecency } from "@/lib/activity/format";
import type { ProjectGithubData } from "@/lib/activity/github";
import { CountBars, SectionCard, StatCard } from "@/components/activity/ActivityWidgets";

export type GithubActivityState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: ProjectGithubData; todayUtc: string };

const OTHER_LABEL = "Other contributors (not connected)";

export default function GithubActivityView({
  state,
  viewerIsFounder,
  names,
  onRetry,
}: {
  state: GithubActivityState;
  viewerIsFounder: boolean;
  names: Record<string, string>;
  onRetry: () => void;
}) {
  if (state.status === "loading") {
    return (
      <div
        aria-busy="true"
        aria-label="Loading GitHub activity"
        className="h-40 animate-pulse rounded-2xl border border-border bg-surface"
      />
    );
  }

  if (state.status === "error") {
    return (
      <SectionCard title="GitHub activity">
        <p className="text-sm text-red-400">{state.message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:border-[#00AFEF]/40"
        >
          Try again
        </button>
      </SectionCard>
    );
  }

  const { data, todayUtc } = state;
  const title = viewerIsFounder ? "GitHub activity" : "Your GitHub activity";

  const people = data.people
    .map((person) => ({
      ...person,
      label: person.userId ? (names[person.userId] ?? "Team member") : OTHER_LABEL,
    }))
    .sort((a, b) => {
      if (a.userId === null && b.userId !== null) return 1;
      if (b.userId === null && a.userId !== null) return -1;
      return a.label.localeCompare(b.label);
    });

  return (
    <div className="space-y-6">
      {data.repos.verified === 0 ? (
        <SectionCard title={title} subtitle="A separate source from editor activity.">
          <p className="py-6 text-center text-sm text-muted">
            {data.repos.total === 0
              ? viewerIsFounder
                ? "No GitHub repository is linked to this project yet. Link a public repository below."
                : "The project founder has not linked a GitHub repository yet."
              : viewerIsFounder
                ? "A repository is linked but not verified yet. Complete the verification step below."
                : "A repository is linked but not verified yet."}
          </p>
        </SectionCard>
      ) : !data.hasActivity ? (
        <SectionCard title={title} subtitle="A separate source from editor activity.">
          <p className="py-6 text-center text-sm text-muted">
            No GitHub activity in the last 30 days.
            {data.repos.lastSyncedAt
              ? ` Last synced ${new Date(data.repos.lastSyncedAt).toLocaleString()}.`
              : " The repository has not been synced yet."}
          </p>
        </SectionCard>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Commits (30 days)" value={String(data.totals.commits)} />
            <StatCard label="Pull requests opened" value={String(data.totals.prsOpened)} />
            <StatCard label="Pull requests merged" value={String(data.totals.prsMerged)} />
            <StatCard
              label="Last synced"
              value={data.repos.lastSyncedAt ? new Date(data.repos.lastSyncedAt).toLocaleDateString() : "Never"}
              hint="GitHub numbers update when the founder syncs"
            />
          </div>

          <SectionCard
            title={`${title}: commits per day`}
            subtitle="Commits on the default branch of linked public repositories. Days are UTC days."
          >
            <CountBars series={data.series} unit="commits" />
          </SectionCard>

          <SectionCard
            title={viewerIsFounder ? "GitHub contributors" : "Your GitHub contributions"}
            subtitle="Last 30 days. Only people who connected their GitHub account are named."
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
                    <th className="px-2 py-2 font-medium">Person</th>
                    <th className="px-2 py-2 font-medium">Commits</th>
                    <th className="px-2 py-2 font-medium">PRs opened</th>
                    <th className="px-2 py-2 font-medium">PRs merged</th>
                    <th className="px-2 py-2 font-medium">Last GitHub activity</th>
                  </tr>
                </thead>
                <tbody>
                  {people.map((person) => (
                    <tr key={person.userId ?? "other"} className="border-b border-border/60 last:border-0">
                      <td className="px-2 py-3 font-medium text-foreground">{person.label}</td>
                      <td className="px-2 py-3 text-foreground">{person.totals.commits}</td>
                      <td className="px-2 py-3 text-foreground">{person.totals.prsOpened}</td>
                      <td className="px-2 py-3 text-foreground">{person.totals.prsMerged}</td>
                      <td className="px-2 py-3 text-muted">{describeRecency(person.lastDate, todayUtc)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </>
      )}

      {!data.viewerLinked && (
        <div
          role="note"
          className="rounded-2xl border border-[#00AFEF]/20 bg-[#00AFEF]/5 px-4 py-4 text-sm text-muted sm:px-5"
        >
          Your GitHub account is not connected, so your own commits and pull requests are not counted
          for you.{" "}
          <Link href="/profile/github" className="font-medium text-[#00AFEF] hover:underline">
            Connect GitHub
          </Link>
        </div>
      )}

      <div
        role="note"
        className="space-y-1 rounded-2xl border border-[#00AFEF]/20 bg-[#00AFEF]/5 px-4 py-4 text-sm text-muted sm:px-5"
      >
        <p>
          GitHub activity is shown on its own and is never added to editor time. It counts commits and
          pull requests in public repositories linked by the founder. Code, messages and titles are not
          stored.
        </p>
        <p>
          Like editor time, these counts are a signal of participation, not a measure of quality or
          completed work. Work that is not on GitHub does not appear.
        </p>
      </div>
    </div>
  );
}