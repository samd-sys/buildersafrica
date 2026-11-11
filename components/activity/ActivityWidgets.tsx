import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { formatDayLabel, formatDuration } from "@/lib/activity/format";
import type { DayPoint, Recency } from "@/lib/activity/types";

export function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface px-4 py-5 sm:px-6">
      <div className="mb-4 space-y-1">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface px-4 py-4 sm:px-5">
      <p className="text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

/**
 * Reminder shown on every activity page: these numbers are a participation
 * signal, not a measure of productivity or finished work.
 */
export function ActivityNote({ children }: { children: ReactNode }) {
  return (
    <div
      role="note"
      className="flex items-start gap-3 rounded-2xl border border-[#00AFEF]/20 bg-[#00AFEF]/5 px-4 py-4 text-sm text-muted sm:px-5"
    >
      <Info size={16} className="mt-0.5 shrink-0 text-[#00AFEF]" aria-hidden="true" />
      <div className="space-y-1">{children}</div>
    </div>
  );
}

const RECENCY_STYLES: Record<Recency, { label: string; className: string }> = {
  today: {
    label: "Active today",
    className: "border-emerald-400/20 bg-emerald-400/10 text-emerald-400",
  },
  "this-week": {
    label: "Active this week",
    className: "border-[#00AFEF]/20 bg-[#00AFEF]/10 text-[#00AFEF]",
  },
  earlier: {
    label: "No activity this week",
    className: "border-border bg-surface-secondary text-muted",
  },
  none: {
    label: "Nothing recorded yet",
    className: "border-dashed border-border bg-transparent text-muted",
  },
};

/** Neutral colours on purpose: a quiet week is not a warning. */
export function RecencyBadge({ recency }: { recency: Recency }) {
  const style = RECENCY_STYLES[recency];

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold ${style.className}`}
    >
      {style.label}
    </span>
  );
}

export function ActivityBars({ series }: { series: DayPoint[] }) {
  const max = Math.max(0, ...series.map((point) => point.activeMs));
  const total = series.reduce((sum, point) => sum + point.activeMs, 0);

  if (total === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted">
        No activity recorded in the last {series.length} days.
      </p>
    );
  }

  const first = series[0];
  const middle = series[Math.floor(series.length / 2)];
  const last = series[series.length - 1];

  return (
    <div>
      <div
        role="img"
        aria-label={`Daily active time over the last ${series.length} days, ${formatDuration(total)} in total`}
        className="flex h-40 items-end gap-1"
      >
        {series.map((point) => {
          const percent = max === 0 ? 0 : Math.round((point.activeMs / max) * 100);

          return (
            <div
              key={point.date}
              title={`${formatDayLabel(point.date)}: ${formatDuration(point.activeMs)}`}
              className="flex h-full min-w-0 flex-1 items-end"
            >
              <div
                className={
                  point.activeMs > 0
                    ? "w-full rounded-t bg-[#00AFEF]"
                    : "w-full rounded-t bg-border"
                }
                style={{ height: point.activeMs > 0 ? `${Math.max(percent, 4)}%` : "2px" }}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex justify-between text-[11px] text-muted">
        <span>{formatDayLabel(first.date)}</span>
        <span>{formatDayLabel(middle.date)}</span>
        <span>{formatDayLabel(last.date)}</span>
      </div>
    </div>
  );
}

export function ActivitySkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading activity">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl border border-border bg-surface" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl border border-border bg-surface" />
      <div className="h-48 animate-pulse rounded-2xl border border-border bg-surface" />
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface px-6 py-14 text-center">
      <p className="text-lg font-bold text-foreground">{title}</p>
      <div className="max-w-md space-y-2 text-sm text-muted">{children}</div>
    </div>
  );
}

export function Avatar({ name, url }: { name: string; url: string | null }) {
  if (url) {
    return (
      <img
        src={url}
        alt=""
        className="h-9 w-9 shrink-0 rounded-full border border-border object-cover"
      />
    );
  }

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface-secondary text-xs font-bold text-muted">
      {initials || "?"}
    </span>
  );
}