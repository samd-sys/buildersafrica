
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  AlertCircle,
  ArrowRight,
  MessageSquare,
  RefreshCw,
} from "lucide-react";

import {
  STATUS_META,
  STATUS_ORDER,
  formatDateTime,
  relativeTime,
  type StatusFilter,
  type SupportTicket,
} from "./support/ticketUtils";

type LatestTicket = Pick<
  SupportTicket,
  "id" | "subject" | "status" | "created_at" | "user_email"
>;

const CARDS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Total Tickets" },
  ...STATUS_ORDER.map((s) => ({
    key: s,
    label: STATUS_META[s].label,
  })),
];

// ==========================================
// Skeleton Loading Component
// ==========================================

function OverviewSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading support overview"
      className="space-y-6"
    >
      {/* Page heading and refresh button */}
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="h-5 w-40 animate-pulse rounded-md bg-surface-secondary" />
          <div className="h-3 w-28 animate-pulse rounded-md bg-surface-secondary" />
        </div>

        <div className="h-10 w-24 animate-pulse rounded-xl bg-surface-secondary" />
      </div>

      {/* Statistics cards */}
      <section
        className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
        aria-label="Loading ticket statistics"
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="space-y-4 rounded-2xl border border-border bg-surface p-4 sm:p-5"
          >
            <div className="h-3 w-24 max-w-full animate-pulse rounded bg-surface-secondary" />
            <div className="h-8 w-16 animate-pulse rounded bg-surface-secondary" />
          </div>
        ))}
      </section>

      {/* Latest tickets skeleton */}
      <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="h-4 w-28 animate-pulse rounded bg-surface-secondary" />
          <div className="h-3 w-20 animate-pulse rounded bg-surface-secondary" />
        </div>

        <div className="divide-y divide-border">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-3 py-4"
            >
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-3/4 max-w-64 animate-pulse rounded bg-surface-secondary" />
                <div className="h-3 w-1/2 max-w-48 animate-pulse rounded bg-surface-secondary" />
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <div className="h-6 w-20 animate-pulse rounded-full bg-surface-secondary" />
                <div className="hidden h-3 w-12 animate-pulse rounded bg-surface-secondary sm:block" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ==========================================
// Admin Overview Page
// ==========================================

export default function AdminOverviewPage() {
  const [counts, setCounts] = useState<Record<StatusFilter, number> | null>(
    null
  );

  const [latest, setLatest] = useState<LatestTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // ==========================================
  // Load Dashboard Data
  // ==========================================

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      // Get ticket counts directly from the database
      const countOf = (status?: string) => {
        const query = supabase
          .from("support_tickets")
          .select("id", { count: "exact", head: true });

        return status ? query.eq("status", status) : query;
      };

      const [all, open, inProgress, resolved, recent] = await Promise.all([
        countOf(),
        countOf("open"),
        countOf("in_progress"),
        countOf("resolved"),
        supabase
          .from("support_tickets")
          .select("id, subject, status, created_at, user_email")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      // Check for database errors
      const failed = [all, open, inProgress, resolved, recent].find(
        (r) => r.error
      );

      if (failed?.error) {
        throw failed.error;
      }

      // Update statistics
      setCounts({
        all: all.count ?? 0,
        open: open.count ?? 0,
        in_progress: inProgress.count ?? 0,
        resolved: resolved.count ?? 0,
      });

      // Update latest tickets
      setLatest((recent.data ?? []) as LatestTicket[]);
    } catch (err) {
      console.error("Admin overview error:", err);
      setError("Unable to load the overview. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ==========================================
  // Initial Data Fetch
  // ==========================================

  useEffect(() => {
    load();
  }, [load]);

  // ==========================================
  // Skeleton Loading State
  // ==========================================

  if (loading) {
    return <OverviewSkeleton />;
  }

  // ==========================================
  // Main Dashboard
  // ==========================================

  return (
    <div className="space-y-6">
      {/* Header and Refresh */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Support overview</h2>

        <button
          type="button"
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-secondary disabled:opacity-50"
        >
          <RefreshCw
            size={15}
            className={refreshing ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500"
        >
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Ticket Statistics */}
      <section
        className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
        aria-label="Ticket statistics"
      >
        {CARDS.map((card) => (
          <Link
            key={card.key}
            href={
              card.key === "all"
                ? "/dashboard/admin/support"
                : `/dashboard/admin/support?status=${card.key}`
            }
            className="group rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-[#00AFEF]/40 sm:p-5"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="flex min-w-0 items-center gap-2 text-xs text-muted">
                {card.key === "all" ? (
                  <MessageSquare
                    size={14}
                    className="shrink-0 text-[#00AFEF]"
                  />
                ) : (
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${STATUS_META[card.key].dot}`}
                    aria-hidden="true"
                  />
                )}

                <span className="truncate">{card.label}</span>
              </p>

              <ArrowRight
                size={14}
                className="shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100"
              />
            </div>

            <p className="mt-3 text-2xl font-bold">
              {counts ? counts[card.key] : 0}
            </p>
          </Link>
        ))}
      </section>

      {/* Latest Tickets */}
      <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">Latest tickets</h3>

          <Link
            href="/dashboard/admin/support"
            className="flex shrink-0 items-center gap-1 text-xs font-medium text-[#00AFEF] hover:underline"
          >
            Open inbox
            <ArrowRight size={12} />
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
                  className="flex items-center justify-between gap-3 py-3 transition-colors hover:text-[#00AFEF] sm:gap-4"
                >
                  {/* Ticket Information */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {ticket.subject}
                    </p>

                    <p className="mt-0.5 truncate text-xs text-muted">
                      {ticket.user_email || "Email unavailable"} ·{" "}
                      {formatDateTime(ticket.created_at)}
                    </p>
                  </div>

                  {/* Ticket Status */}
                  <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-secondary px-2.5 py-1 text-[11px] font-medium text-foreground">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${STATUS_META[ticket.status].dot}`}
                        aria-hidden="true"
                      />

                      {STATUS_META[ticket.status].label}
                    </span>

                    <span className="hidden text-[11px] text-muted sm:inline">
                      {relativeTime(ticket.created_at)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
