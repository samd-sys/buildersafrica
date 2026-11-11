import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { describeRecency, formatDuration } from "@/lib/activity/format";
import type { ProjectActivityData } from "@/lib/activity/types";
import PageShell from "./PageShell";
import ContributorsTable from "./ContributorsTable";
import {
  ActivityBars,
  ActivityNote,
  ActivitySkeleton,
  EmptyState,
  SectionCard,
  StatCard,
} from "./ActivityWidgets";

export type ProjectActivityState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "not-found" }
  | { status: "no-access" }
  | { status: "error"; message: string }
  | { status: "ready"; data: ProjectActivityData; todayKey: string };

export default function ProjectActivityView({
  state,
  projectId,
  onRetry,
}: {
  state: ProjectActivityState;
  projectId: string;
  onRetry: () => void;
}) {
  const title =
    state.status === "ready" ? `${state.data.project.title}: Activity` : "Project Activity";

  return (
    <PageShell
      title={title}
      description={
        state.status === "ready" && state.data.viewerIsFounder
          ? "Recorded editing activity for your team, from the BuildersAfrica Activity Tracker."
          : "Recorded editing activity from the BuildersAfrica Activity Tracker."
      }
      actions={
        <Link
          href={`/team/${projectId}`}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-border bg-surface-secondary px-4 py-2 text-sm font-medium text-muted hover:border-[#00AFEF]/30 hover:text-foreground"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Back to team
        </Link>
      }
    >
      {state.status === "loading" && <ActivitySkeleton />}

      {state.status === "signed-out" && (
        <EmptyState title="Sign in to see project activity">
          <Link
            href="/login"
            className="mt-2 inline-flex rounded-lg bg-[#00AFEF] px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
          >
            Sign in
          </Link>
        </EmptyState>
      )}

      {state.status === "not-found" && (
        <EmptyState title="Project not found">
          <p>This project does not exist, or the link is wrong.</p>
        </EmptyState>
      )}

      {state.status === "no-access" && (
        <EmptyState title="You do not have access to this page">
          <p>Activity is visible to a project&apos;s founder and its active team members.</p>
        </EmptyState>
      )}

      {state.status === "error" && (
        <EmptyState title="Could not load activity">
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

      {state.status === "ready" && (
        <>
          {!state.data.viewerIsFounder && (
            <ActivityNote>
              <p>
                You are viewing your own recorded activity on this project. Only the project
                founder can see the whole team.
              </p>
            </ActivityNote>
          )}

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label={state.data.viewerIsFounder ? "Team time, all time" : "Your time, all time"}
              value={formatDuration(state.data.totalMs)}
            />
            <StatCard label="Last 7 days" value={formatDuration(state.data.last7Ms)} />
            {state.data.viewerIsFounder ? (
              <StatCard
                label="Members with activity this week"
                value={`${state.data.contributorsActiveLast7} of ${state.data.rosterSize}`}
                hint="Based on recorded VS Code activity only"
              />
            ) : (
              <StatCard label="Last 30 days" value={formatDuration(state.data.last30Ms)} />
            )}
            <StatCard
              label="Last recorded activity"
              value={describeRecency(state.data.lastActiveDate, state.todayKey)}
            />
          </div>

          <SectionCard
            title={state.data.viewerIsFounder ? "Team activity" : "Your activity"}
            subtitle="Active editing time per day over the last 30 days."
          >
            <ActivityBars series={state.data.series30} />
          </SectionCard>

          {state.data.viewerIsFounder && (
            <SectionCard
              title="Contributors"
              subtitle="Everyone on the team, listed alphabetically after the founder."
            >
              <ContributorsTable
                contributors={state.data.contributors}
                todayKey={state.todayKey}
              />
            </SectionCard>
          )}

          <ActivityNote>
            <p>
              Recorded activity only reflects time spent editing files in VS Code with the
              BuildersAfrica Activity Tracker connected to this project.
            </p>
            <p>
              It is not a measure of productivity, quality or completed work. No record does not
              mean no work: people may work outside VS Code, or may not have set up the tracker
              yet.
            </p>
          </ActivityNote>
        </>
      )}
    </PageShell>
  );
}