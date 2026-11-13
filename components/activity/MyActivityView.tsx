
import Link from "next/link";
import { formatDelta, formatDuration } from "@/lib/activity/format";
import type { MyActivityData } from "@/lib/activity/types";
import PageShell from "./PageShell";
import ActivityComboChart from "./ActivityComboChart";
import {
  ActivityNote,
  ActivitySkeleton,
  EmptyState,
  SectionCard,
  StatCard,
} from "./ActivityWidgets";
import {
  HistoryTable,
  ProjectsTable,
  SessionsList,
} from "./MyActivityPanels";

export type MyActivityState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "error"; message: string }
  | { status: "ready"; data: MyActivityData; todayKey: string };

export default function MyActivityView({
  state,
  onRetry,
}: {
  state: MyActivityState;
  onRetry: () => void;
}) {
  return (
    <PageShell
      title="My Activity"
      description="Time recorded by the BuildersAfrica Activity Tracker in VS Code, for the projects you work on."
    >
      {state.status === "loading" && <ActivitySkeleton />}

      {state.status === "signed-out" && (
        <EmptyState title="Sign in to see your activity">
          <p>
            Your activity is private to you and the founders of the
            projects you work on.
          </p>

          <Link
            href="/login"
            className="mt-2 inline-flex rounded-lg bg-[#00AFEF] px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
          >
            Sign in
          </Link>
        </EmptyState>
      )}

      {state.status === "error" && (
        <EmptyState title="Could not load your activity">
          <p>{state.message}</p>

          <button
            type="button"
            onClick={onRetry}
            className="mt-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:border-[#00AFEF]/40"
          >
            Try again
          </button>
        </EmptyState>
      )}

      {state.status === "ready" && !state.data.hasAnyActivity && (
        <EmptyState title="No activity recorded yet">
          <p>
            Install the BuildersAfrica Activity Tracker in VS Code,
            connect your account, choose the project you are working on,
            and start tracking.
          </p>

          <p>Finished sessions appear here automatically.</p>
        </EmptyState>
      )}

      {state.status === "ready" && state.data.hasAnyActivity && (
        <>
          {/* Activity statistics */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Last 7 days"
              value={formatDuration(state.data.windows.last7Ms)}
              hint={`${formatDelta(
                state.data.windows.last7Ms -
                  state.data.windows.prev7Ms
              )} compared with the 7 days before`}
            />

            <StatCard
              label="Last 30 days"
              value={formatDuration(state.data.windows.last30Ms)}
              hint={`${state.data.windows.activeDays30} days with recorded activity`}
            />

            <StatCard
              label="All time"
              value={formatDuration(state.data.allTimeMs)}
            />

            <StatCard
              label="Files saved (30 days)"
              value={String(state.data.windows.filesSaved30)}
            />
          </div>

          {/* Combined bar and line chart */}
          <SectionCard
            title="Daily Activity"
            subtitle="Explore your daily activity using the combined bar and line chart."
          >
            <ActivityComboChart series={state.data.series30} />
          </SectionCard>

          {/* Projects */}
          <SectionCard title="Projects you have worked on">
            <ProjectsTable
              projects={state.data.projects}
              todayKey={state.todayKey}
            />
          </SectionCard>

          {/* Recent sessions */}
          <SectionCard
            title="Recent sessions"
            subtitle="Your latest finished tracking sessions."
          >
            <SessionsList sessions={state.data.recentSessions} />
          </SectionCard>

          {/* Activity history */}
          <SectionCard
            title="Activity history"
            subtitle="Days with recorded activity in the last 30 days."
          >
            <HistoryTable history={state.data.history} />
          </SectionCard>

          {/* Privacy information */}
          <ActivityNote>
            <p>
              <strong className="text-foreground">
                Who can see this:
              </strong>{" "}
              only you, and the founder of each project, who sees the
              daily time and files-saved count recorded for their own
              project. Founders cannot see your time on other projects
              or the start and end times of your sessions.
            </p>

            <p>
              These numbers show time spent editing files in VS Code.
              They are not a measure of productivity, quality or
              finished work.
            </p>
          </ActivityNote>
        </>
      )}
    </PageShell>
  );
}
