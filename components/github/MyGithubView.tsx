import Link from "next/link";
import { describeRecency } from "@/lib/activity/format";
import type { MyGithubData } from "@/lib/activity/github";
import { CountBars, SectionCard, StatCard } from "@/components/activity/ActivityWidgets";

export type MyGithubState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: MyGithubData; todayUtc: string };

export default function MyGithubView({
  state,
  onRetry,
}: {
  state: MyGithubState;
  onRetry: () => void;
}) {
  if (state.status === "loading") {
    return (
      <div
        aria-busy="true"
        aria-label="Loading GitHub activity"
        className="h-32 animate-pulse rounded-2xl border border-border bg-surface"
      />
    );
  }

  if (state.status === "error") {
    return (
      <SectionCard title="My GitHub activity">
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

  if (!data.linked) {
    return (
      <SectionCard title="My GitHub activity" subtitle="A separate source from editor activity.">
        <p className="text-sm text-muted">
          Connect your GitHub account to see your commits and pull requests in the repositories linked to
          your projects.
        </p>
        <Link
          href="/profile/github"
          className="mt-3 inline-flex rounded-lg bg-[#00AFEF] px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
        >
          Connect GitHub
        </Link>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-6">
      {!data.hasActivity ? (
        <SectionCard title="My GitHub activity" subtitle="A separate source from editor activity.">
          <p className="py-6 text-center text-sm text-muted">
            No GitHub activity for @{data.login ?? "your account"} in the last 30 days, in repositories
            linked to your projects. Numbers update when a project founder syncs a repository.
          </p>
        </SectionCard>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Commits (30 days)" value={String(data.totals.commits)} />
            <StatCard label="Pull requests opened" value={String(data.totals.prsOpened)} />
            <StatCard label="Pull requests merged" value={String(data.totals.prsMerged)} />
          </div>

          <SectionCard
            title="My GitHub activity: commits per day"
            subtitle="Your commits in repositories linked to your projects. Days are UTC days."
          >
            <CountBars series={data.series} unit="commits" />
          </SectionCard>

          <SectionCard title="By project" subtitle="Last 30 days.">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
                    <th className="px-2 py-2 font-medium">Project</th>
                    <th className="px-2 py-2 font-medium">Commits</th>
                    <th className="px-2 py-2 font-medium">PRs opened</th>
                    <th className="px-2 py-2 font-medium">PRs merged</th>
                    <th className="px-2 py-2 font-medium">Last GitHub activity</th>
                  </tr>
                </thead>
                <tbody>
                  {data.projects.map((project) => (
                    <tr key={project.projectId} className="border-b border-border/60 last:border-0">
                      <td className="px-2 py-3 font-medium text-foreground">{project.title}</td>
                      <td className="px-2 py-3 text-foreground">{project.totals.commits}</td>
                      <td className="px-2 py-3 text-foreground">{project.totals.prsOpened}</td>
                      <td className="px-2 py-3 text-foreground">{project.totals.prsMerged}</td>
                      <td className="px-2 py-3 text-muted">{describeRecency(project.lastDate, todayUtc)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </>
      )}

      <div
        role="note"
        className="space-y-1 rounded-2xl border border-[#00AFEF]/20 bg-[#00AFEF]/5 px-4 py-4 text-sm text-muted sm:px-5"
      >
        <p>
          <strong className="text-foreground">Who can see this:</strong> you, and the founder of each
          project, who sees these counts for their own project. Founders cannot see your GitHub activity in
          projects they are not part of.
        </p>
        <p>
          GitHub activity is shown on its own and is not added to editor time. It is not a measure of
          productivity, quality or finished work.
        </p>
      </div>
    </div>
  );
}