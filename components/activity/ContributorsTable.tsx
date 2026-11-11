import { describeRecency, formatDuration } from "@/lib/activity/format";
import type { ContributorRow } from "@/lib/activity/types";
import { Avatar, RecencyBadge } from "./ActivityWidgets";

export default function ContributorsTable({
  contributors,
  todayKey,
}: {
  contributors: ContributorRow[];
  todayKey: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
            <th className="px-2 py-2 font-medium">Member</th>
            <th className="px-2 py-2 font-medium">Last 7 days</th>
            <th className="px-2 py-2 font-medium">Last 30 days</th>
            <th className="px-2 py-2 font-medium">All time</th>
            <th className="px-2 py-2 font-medium">Active days</th>
            <th className="px-2 py-2 font-medium">Last recorded</th>
          </tr>
        </thead>
        <tbody>
          {contributors.map((member) => (
            <tr key={member.userId} className="border-b border-border/60 last:border-0">
              <td className="px-2 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={member.name} url={member.avatarUrl} />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{member.name}</p>
                    <p className="truncate text-xs text-muted">
                      {member.role ?? member.title ?? "Team member"}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-2 py-3 text-foreground">{formatDuration(member.last7Ms)}</td>
              <td className="px-2 py-3 text-foreground">{formatDuration(member.last30Ms)}</td>
              <td className="px-2 py-3 text-foreground">{formatDuration(member.totalMs)}</td>
              <td className="px-2 py-3 text-foreground">{member.activeDays}</td>
              <td className="px-2 py-3">
                <div className="flex flex-col items-start gap-1">
                  <RecencyBadge recency={member.recency} />
                  <span className="text-xs text-muted">
                    {describeRecency(member.lastActiveDate, todayKey)}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}