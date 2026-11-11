import { describeRecency, formatDayLabel, formatDuration } from "@/lib/activity/format";
import type { HistoryRow, ProjectRow, SessionRow } from "@/lib/activity/types";

export function ProjectsTable({ projects, todayKey }: { projects: ProjectRow[]; todayKey: string }) {
  if (projects.length === 0) {
    return <p className="py-6 text-center text-sm text-muted">No projects with recorded activity yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
            <th className="px-2 py-2 font-medium">Project</th>
            <th className="px-2 py-2 font-medium">Last 7 days</th>
            <th className="px-2 py-2 font-medium">All time</th>
            <th className="px-2 py-2 font-medium">Active days</th>
            <th className="px-2 py-2 font-medium">Last recorded</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.projectId} className="border-b border-border/60 last:border-0">
              <td className="px-2 py-3 font-medium text-foreground">{project.title}</td>
              <td className="px-2 py-3 text-foreground">{formatDuration(project.last7Ms)}</td>
              <td className="px-2 py-3 text-foreground">{formatDuration(project.totalMs)}</td>
              <td className="px-2 py-3 text-foreground">{project.activeDays}</td>
              <td className="px-2 py-3 text-muted">
                {describeRecency(project.lastActiveDate, todayKey)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatSessionRange(startedAt: string, endedAt: string): string {
  const start = new Date(startedAt);
  const end = new Date(endedAt);
  const day = start.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  const time = (date: Date) => date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

  return `${day}, ${time(start)} – ${time(end)}`;
}

export function SessionsList({ sessions }: { sessions: SessionRow[] }) {
  if (sessions.length === 0) {
    return <p className="py-6 text-center text-sm text-muted">No finished sessions yet.</p>;
  }

  return (
    <ul className="divide-y divide-border/60">
      {sessions.map((session) => (
        <li key={session.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              {formatSessionRange(session.startedAt, session.endedAt)}
            </p>
            <p className="truncate text-xs text-muted">
              {session.projectTitles.length > 0 ? session.projectTitles.join(", ") : "No project"}
              {session.recovered ? " · Recovered after an interruption" : ""}
            </p>
          </div>
          <p className="shrink-0 text-sm text-foreground">
            {formatDuration(session.activeMs)} active
            <span className="text-muted">
              {" "}
              · {session.filesSaved} {session.filesSaved === 1 ? "file" : "files"} saved
            </span>
          </p>
        </li>
      ))}
    </ul>
  );
}

export function HistoryTable({ history }: { history: HistoryRow[] }) {
  if (history.length === 0) {
    return <p className="py-6 text-center text-sm text-muted">No days with recorded activity in the last 30 days.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
            <th className="px-2 py-2 font-medium">Day</th>
            <th className="px-2 py-2 font-medium">Active time</th>
            <th className="px-2 py-2 font-medium">Files saved</th>
            <th className="px-2 py-2 font-medium">Projects</th>
          </tr>
        </thead>
        <tbody>
          {history.map((day) => (
            <tr key={day.date} className="border-b border-border/60 last:border-0">
              <td className="px-2 py-3 font-medium text-foreground">{formatDayLabel(day.date)}</td>
              <td className="px-2 py-3 text-foreground">{formatDuration(day.activeMs)}</td>
              <td className="px-2 py-3 text-foreground">{day.filesSaved}</td>
              <td className="px-2 py-3 text-foreground">{day.projectCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}