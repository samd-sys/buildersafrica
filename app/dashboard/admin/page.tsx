"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  FolderKanban,
  FolderPlus,
  LifeBuoy,
  Loader2,
  MessageSquare,
  RefreshCw,
  UserPlus,
  Users,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  STATUS_META,
  STATUS_ORDER,
  formatDateTime,
  relativeTime,
  type StatusFilter,
  type SupportTicket,
} from "./support/ticketUtils";

// Shape returned by the admin_overview_stats() database function
type PlatformStats = {
  total_users: number;
  users_last_7_days: number;
  total_projects: number;
  projects_last_7_days: number;
  total_tickets: number;
  open_tickets: number;
  in_progress_tickets: number;
  resolved_tickets: number;
};

// Rows returned by the admin_recent_activity() database function
type ActivityKind = "user" | "project" | "application" | "ticket";
type ActivityItem = {
  kind: ActivityKind;
  title: string;
  detail: string;
  occurred_at: string;
};

type LatestTicket = Pick<SupportTicket, "id" | "subject" | "status" | "created_at" | "user_email">;

const ACTIVITY_ICON: Record<ActivityKind, LucideIcon> = {
  user: UserPlus,
  project: FolderPlus,
  application: Briefcase,
  ticket: LifeBuoy,
};

const TICKET_COUNT_KEY: Record<StatusFilter, keyof PlatformStats> = {
  all: "total_tickets",
  open: "open_tickets",
  in_progress: "in_progress_tickets",
  resolved: "resolved_tickets",
};

const TICKET_CARDS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Total Tickets" },
  ...STATUS_ORDER.map((s) => ({ key: s, label: STATUS_META[s].label })),
];

function describeError(error: { code?: string }): string {
  // 42883 = Postgres "function does not exist", PGRST202 = PostgREST "could not find the function"
  if (error.code === "42883" || error.code === "PGRST202") {
    return "The admin statistics functions are not installed yet. Run the admin SQL script in Supabase, then refresh.";
  }
  return "Unable to load some overview data. Please try again.";
}

const fmt = (n: number | undefined) => (n === undefined ? "—" : n.toLocaleString());

function weekHint(n: number | undefined) {
  if (n === undefined) return "";
  return n === 0 ? "None this week" : `+${n.toLocaleString()} in the last 7 days`;
}

function OverviewSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading admin overview"
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="h-5 w-28 animate-pulse rounded-md bg-surface-secondary" />
        <div className="h-10 w-24 animate-pulse rounded-xl bg-surface-secondary" />
      </div>

      {/* Platform statistics */}
      <section className="space-y-3">
        <div className="h-3 w-20 animate-pulse rounded bg-surface-secondary" />

        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="space-y-4 rounded-2xl border border-border bg-surface p-5"
            >
              <div className="flex items-center justify-between">
                <div className="h-3 w-28 animate-pulse rounded bg-surface-secondary" />
                <div className="h-5 w-5 animate-pulse rounded bg-surface-secondary" />
              </div>

              <div className="h-9 w-24 animate-pulse rounded bg-surface-secondary" />
              <div className="h-3 w-36 animate-pulse rounded bg-surface-secondary" />
            </div>
          ))}
        </div>
      </section>

      {/* Support ticket statistics */}
      <section className="space-y-3">
        <div className="h-3 w-28 animate-pulse rounded bg-surface-secondary" />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="space-y-4 rounded-2xl border border-border bg-surface p-5"
            >
              <div className="h-3 w-24 animate-pulse rounded bg-surface-secondary" />
              <div className="h-8 w-16 animate-pulse rounded bg-surface-secondary" />
            </div>
          ))}
        </div>
      </section>

      {/* Latest tickets and recent activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, sectionIndex) => (
          <section
            key={sectionIndex}
            className="rounded-2xl border border-border bg-surface p-5 sm:p-6"
          >
            <div className="mb-4 h-4 w-32 animate-pulse rounded bg-surface-secondary" />

            <div className="divide-y divide-border">
             {Array.from({ length: sectionIndex === 0 ? 4 : 5 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 py-4"
                >
                  {sectionIndex === 1 && (
                    <div className="h-9 w-9 shrink-0 animate-pulse rounded-xl bg-surface-secondary" />
                  )}

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-surface-secondary" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-surface-secondary" />
                  </div>

                  {sectionIndex === 0 ? (
                    <div className="h-6 w-20 shrink-0 animate-pulse rounded-full bg-surface-secondary" />
                  ) : (
                    <div className="h-3 w-12 shrink-0 animate-pulse rounded bg-surface-secondary" />
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [latest, setLatest] = useState<LatestTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      // Counts and the activity feed come from admin-only database functions
      // (the browser cannot count auth.users itself). The functions refuse
      // anyone who is not in support_admins.
      const [statsRes, activityRes, latestRes] = await Promise.all([
        supabase.rpc("admin_overview_stats"),
        supabase.rpc("admin_recent_activity", { p_limit: 4 }),
        supabase
          .from("support_tickets")
          .select("id, subject, status, created_at, user_email")
          .order("created_at", { ascending: false })
          .limit(4),
      ]);

      const firstError = statsRes.error ?? activityRes.error ?? latestRes.error;
      if (firstError) setError(describeError(firstError));

      setStats(statsRes.error ? null : (statsRes.data as PlatformStats));
      setActivity(activityRes.error ? [] : ((activityRes.data ?? []) as ActivityItem[]));
      setLatest(latestRes.error ? [] : ((latestRes.data ?? []) as LatestTicket[]));
    } catch (err) {
      console.error("Admin overview error:", err);
      setError("Unable to load the overview. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
  return <OverviewSkeleton />;
}
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Overview</h2>
        <button
          type="button"
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-secondary disabled:opacity-50"
        >
          <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Platform */}
      <section aria-labelledby="platform-heading" className="space-y-3">
        <h3 id="platform-heading" className="text-xs font-semibold uppercase tracking-wider text-muted">
          Platform
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted">Registered users</p>
              <Users size={18} className="text-[#00AFEF]" aria-hidden="true" />
            </div>
            <p className="mt-3 text-3xl font-bold">{fmt(stats?.total_users)}</p>
            <p className="mt-1 text-xs text-muted">{weekHint(stats?.users_last_7_days)}</p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted">Projects</p>
              <FolderKanban size={18} className="text-[#00AFEF]" aria-hidden="true" />
            </div>
            <p className="mt-3 text-3xl font-bold">{fmt(stats?.total_projects)}</p>
            <p className="mt-1 text-xs text-muted">{weekHint(stats?.projects_last_7_days)}</p>
          </div>
        </div>
      </section>

      {/* Support tickets: each card opens the inbox with that filter applied */}
      <section aria-labelledby="tickets-heading" className="space-y-3">
        <h3 id="tickets-heading" className="text-xs font-semibold uppercase tracking-wider text-muted">
          Support tickets
        </h3>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {TICKET_CARDS.map((card) => (
            <Link
              key={card.key}
              href={card.key === "all" ? "/dashboard/admin/support" : `/dashboard/admin/support?status=${card.key}`}
              className="group rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-[#00AFEF]/40"
            >
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 text-xs text-muted">
                  {card.key === "all" ? (
                    <MessageSquare size={14} className="text-[#00AFEF]" aria-hidden="true" />
                  ) : (
                    <span className={`h-2 w-2 rounded-full ${STATUS_META[card.key].dot}`} aria-hidden="true" />
                  )}
                  {card.label}
                </p>
                <ArrowRight size={14} className="text-muted opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
              </div>
              <p className="mt-3 text-2xl font-bold">{fmt(stats?.[TICKET_COUNT_KEY[card.key]])}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Latest tickets */}
        <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">Latest tickets</h3>
            <Link href="/dashboard/admin/support" className="flex items-center gap-1 text-xs font-medium text-[#00AFEF] hover:underline">
              Open inbox <ArrowRight size={12} aria-hidden="true" />
            </Link>
          </div>

          {latest.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted">
              No support tickets yet.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {latest.map((ticket) => (
                <li key={ticket.id}>
                  <Link
                    href={`/dashboard/admin/support?ticket=${ticket.id}`}
                    className="flex items-center justify-between gap-4 py-3 transition-colors hover:text-[#00AFEF]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{ticket.subject}</p>
                      <p className="mt-0.5 truncate text-xs text-muted">
                        {ticket.user_email || "Email unavailable"} · {relativeTime(ticket.created_at)}
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface-secondary px-2.5 py-1 text-[11px] font-medium text-foreground">
                      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_META[ticket.status].dot}`} aria-hidden="true" />
                      {STATUS_META[ticket.status].label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        
{/* Recent platform activity */}
<section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
  <div className="flex items-center justify-between gap-3">
    <h3 className="text-sm font-semibold">Recent activity</h3>

    <Link
      href="/dashboard/admin/activities"
      className="flex shrink-0 items-center gap-1 text-xs font-medium text-[#00AFEF] hover:underline"
    >
      Open activities
      <ArrowRight size={12} aria-hidden="true" />
    </Link>
  </div>

  {activity.length === 0 ? (
    <p className="mt-4 rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted">
      No recent activity.
    </p>
  ) : (
    <ul className="mt-4 divide-y divide-border">
      {activity.slice(0, 4).map((item, index) => {
        const Icon = ACTIVITY_ICON[item.kind] ?? MessageSquare;

        return (
          <li
            key={`${item.kind}-${item.occurred_at}-${index}`}
            className="flex items-center gap-3 py-3"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-secondary">
              <Icon size={16} className="text-[#00AFEF]" aria-hidden="true" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.title}</p>
              <p className="mt-0.5 truncate text-xs text-muted">
                {item.detail}
              </p>
            </div>

            <time
              dateTime={item.occurred_at}
              title={formatDateTime(item.occurred_at)}
              className="shrink-0 text-[11px] text-muted"
            >
              {relativeTime(item.occurred_at)}
            </time>
          </li>
        );
      })}
    </ul>
  )}
</section>

      </div>
    </div>
  );
}