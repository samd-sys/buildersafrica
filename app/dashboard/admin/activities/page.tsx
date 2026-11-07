
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  FolderPlus,
  LifeBuoy,
  MessageSquare,
  RefreshCw,
  UserPlus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatDateTime, relativeTime } from "../support/ticketUtils";

type ActivityKind = "user" | "project" | "application" | "ticket";

type ActivityItem = {
  kind: ActivityKind;
  title: string;
  detail: string;
  occurred_at: string;
};

const ACTIVITY_ICON: Record<ActivityKind, LucideIcon> = {
  user: UserPlus,
  project: FolderPlus,
  application: Briefcase,
  ticket: LifeBuoy,
};

function ActivitiesSkeleton() {
  return (
    <div role="status" aria-label="Loading activities" className="space-y-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4"
        >
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-surface-secondary" />

          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-2/3 animate-pulse rounded bg-surface-secondary" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-surface-secondary" />
          </div>

          <div className="h-3 w-16 shrink-0 animate-pulse rounded bg-surface-secondary" />
        </div>
      ))}
    </div>
  );
}

export default function AdminActivitiesPage() {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const { data, error: activityError } = await supabase.rpc(
        "admin_recent_activity",
        { p_limit: 100 }
      );

      if (activityError) throw activityError;

      setActivity((data ?? []) as ActivityItem[]);
    } catch (err) {
      console.error("Admin activities error:", err);
      setError("Unable to load activities. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/dashboard/admin"
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-[#00AFEF]"
          >
            <ArrowLeft size={14} />
            Back to overview
          </Link>

          <h2 className="text-lg font-semibold">Platform activities</h2>
          <p className="mt-1 text-xs text-muted">
            A record of recent activity across BuildersAfrica.
          </p>
        </div>

        <button
          type="button"
          onClick={() => load(true)}
          disabled={refreshing || loading}
          className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-secondary disabled:opacity-50"
        >
          <RefreshCw
            size={15}
            className={refreshing ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500"
        >
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Activities */}
      <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">Activity history</h3>

          {!loading && (
            <span className="text-xs text-muted">
              {activity.length} activities
            </span>
          )}
        </div>

        {loading ? (
          <div className="mt-4">
            <ActivitiesSkeleton />
          </div>
        ) : activity.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquare size={30} className="text-muted" />
            <p className="mt-3 text-sm font-medium">
              No activities yet
            </p>
            <p className="mt-1 text-xs text-muted">
              Platform activities will appear here as users interact with BuildersAfrica.
            </p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {activity.map((item, index) => {
              const Icon = ACTIVITY_ICON[item.kind] ?? MessageSquare;

              return (
                <li
                  key={`${item.kind}-${item.occurred_at}-${index}`}
                  className="flex items-center gap-3 py-4"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-secondary">
                    <Icon
                      size={17}
                      className="text-[#00AFEF]"
                      aria-hidden="true"
                    />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-1 text-xs text-muted">
                      {item.detail}
                    </p>
                  </div>

                  <time
                    dateTime={item.occurred_at}
                    title={formatDateTime(item.occurred_at)}
                    className="shrink-0 text-right text-[11px] text-muted"
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
  );
}
