"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  Inbox,
  Loader2,
  Mail,
  RefreshCw,
  Search,
} from "lucide-react";
import {
  STATUS_META,
  STATUS_ORDER,
  countByStatus,
  filterTickets,
  formatDateTime,
  isTicketStatus,
  relativeTime,
  subjectOptions,
  type StatusFilter,
  type SupportTicket,
  type TicketStatus,
} from "./ticketUtils";

// The inbox loads the newest tickets in one request. Supabase returns at most
// 1,000 rows per request, so this stays safely under that.
const TICKET_LIMIT = 500;

function StatusPill({ status }: { status: TicketStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-secondary px-2.5 py-1 text-[11px] font-medium text-foreground">
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
      {meta.label}
    </span>
  );
}


function SupportInboxSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading support inbox"
      className="space-y-4"
    >
      {/* Page heading */}
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="h-5 w-36 animate-pulse rounded-md bg-surface-secondary" />
          <div className="h-3 w-28 animate-pulse rounded-md bg-surface-secondary" />
        </div>

        <div className="h-10 w-24 animate-pulse rounded-xl bg-surface-secondary" />
      </div>

      {/* Inbox layout */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">

        {/* Ticket list skeleton */}
        <section className="min-w-0 space-y-3 rounded-2xl border border-border bg-surface p-4">
          {/* Search */}
          <div className="h-10 w-full animate-pulse rounded-xl bg-surface-secondary" />

          {/* Subject filter */}
          <div className="h-10 w-full animate-pulse rounded-xl bg-surface-secondary" />

          {/* Status filters */}
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-8 w-16 animate-pulse rounded-lg bg-surface-secondary"
              />
            ))}
          </div>

          {/* Ticket cards */}
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="space-y-3 rounded-xl border border-border bg-background p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-surface-secondary" />
                  <div className="h-3 w-12 animate-pulse rounded bg-surface-secondary" />
                </div>

                <div className="space-y-2">
                  <div className="h-3 w-full animate-pulse rounded bg-surface-secondary" />
                  <div className="h-3 w-4/5 animate-pulse rounded bg-surface-secondary" />
                </div>

                <div className="flex items-center gap-2">
                  <div className="h-6 w-20 animate-pulse rounded-full bg-surface-secondary" />
                  <div className="h-3 w-24 animate-pulse rounded bg-surface-secondary" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Ticket details skeleton */}
        <section className="min-w-0 space-y-5 rounded-2xl border border-border bg-surface p-5 sm:p-6">
          {/* Status and ticket ID */}
          <div className="flex items-center gap-2">
            <div className="h-6 w-20 animate-pulse rounded-full bg-surface-secondary" />
            <div className="h-3 w-28 animate-pulse rounded bg-surface-secondary" />
          </div>

          {/* Subject */}
          <div className="h-6 w-3/4 animate-pulse rounded bg-surface-secondary" />

          {/* Sender and date */}
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="space-y-3 rounded-xl bg-surface-secondary p-4"
              >
                <div className="h-3 w-16 animate-pulse rounded bg-surface" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-surface" />
                <div className="h-3 w-full animate-pulse rounded bg-surface" />
              </div>
            ))}
          </div>

          {/* Message */}
          <div className="space-y-3">
            <div className="h-3 w-16 animate-pulse rounded bg-surface-secondary" />
            <div className="space-y-2 rounded-xl border border-border bg-background p-4">
              <div className="h-3 w-full animate-pulse rounded bg-surface-secondary" />
              <div className="h-3 w-full animate-pulse rounded bg-surface-secondary" />
              <div className="h-3 w-4/5 animate-pulse rounded bg-surface-secondary" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-surface-secondary" />
            </div>
          </div>

          {/* Status controls */}
          <div className="space-y-3">
            <div className="h-3 w-16 animate-pulse rounded bg-surface-secondary" />
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-10 animate-pulse rounded-xl bg-surface-secondary"
                />
              ))}
            </div>
          </div>

          {/* Reply button */}
          <div className="h-11 w-full animate-pulse rounded-xl bg-surface-secondary" />
        </section>
      </div>
    </div>
  );
}

function SupportInbox() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status");

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>(isTicketStatus(initialStatus) ? initialStatus : "all");
  const [subject, setSubject] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get("ticket"));
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const { data, error: ticketError } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(TICKET_LIMIT);
      if (ticketError) throw ticketError;

      const rows = (data ?? []) as SupportTicket[];
      setTickets(rows);

      // Sender names come from profiles. Best effort: a missing name just
      // falls back to the email address.
      const ids = [...new Set(rows.map((t) => t.user_id))];
      if (ids.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", ids);
        const map: Record<string, string> = {};
        (profiles ?? []).forEach((p: { user_id: string; full_name: string | null }) => {
          if (p.full_name) map[p.user_id] = p.full_name;
        });
        setNames(map);
      }
    } catch (err) {
      console.error("Support inbox error:", err);
      setError("Unable to load support tickets. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Shows the new status immediately, and puts the old one back if the
  // database refuses the change. RLS blocks silently (no error, zero rows),
  // so "no row came back" has to count as a failure too.
  const updateStatus = async (ticket: SupportTicket, next: TicketStatus) => {
    if (ticket.status === next || updatingId) return;
    const previous = ticket.status;

    setUpdatingId(ticket.id);
    setError("");
    setTickets((all) => all.map((t) => (t.id === ticket.id ? { ...t, status: next } : t)));

    const { data, error: updateError } = await supabase
      .from("support_tickets")
      .update({ status: next })
      .eq("id", ticket.id)
      .select("id");

    if (updateError || !data || data.length === 0) {
      setTickets((all) => all.map((t) => (t.id === ticket.id ? { ...t, status: previous } : t)));
      setError("Could not update the ticket status. Please try again.");
    }
    setUpdatingId(null);
  };

  const subjects = useMemo(() => subjectOptions(tickets), [tickets]);

  const filtered = useMemo(
    () => filterTickets(tickets, { status, subject, query }, names),
    [tickets, status, subject, query, names]
  );

  // Chip counts follow the search and subject filters, but not the status chip itself
  const counts = useMemo(
    () => countByStatus(filterTickets(tickets, { status: "all", subject, query }, names)),
    [tickets, subject, query, names]
  );

  const selected = tickets.find((t) => t.id === selectedId) ?? null;
  const hasFilters = status !== "all" || subject !== "all" || query.trim() !== "";

  const clearFilters = () => {
    setStatus("all");
    setSubject("all");
    setQuery("");
  };

  const senderLabel = (t: SupportTicket) => names[t.user_id] || t.user_email || "Unknown sender";

if (loading) {
  return <SupportInboxSkeleton />;
}

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Support Inbox</h2>
          <p className="text-xs text-muted">
            {filtered.length} of {tickets.length} tickets
            {tickets.length >= TICKET_LIMIT && ` (showing the latest ${TICKET_LIMIT})`}
          </p>
        </div>
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
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        {/* ── Ticket list ── */}
        <section
          aria-label="Tickets"
          className={`${selected ? "hidden lg:flex" : "flex"} min-w-0 flex-col gap-3 rounded-2xl border border-border bg-surface p-4`}
        >
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search tickets"
              placeholder="Search subject, message, name or email..."
              className="w-full rounded-xl border border-border bg-surface-secondary py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-[#00AFEF]/60"
            />
          </div>

          <div className="relative">
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              aria-label="Filter by subject"
              className="w-full appearance-none rounded-xl border border-border bg-surface-secondary px-4 py-2.5 pr-10 text-sm outline-none focus:border-[#00AFEF]/60"
            >
              <option value="all">All subjects</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
          </div>

          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
            {(["all", ...STATUS_ORDER] as StatusFilter[]).map((key) => {
              const active = status === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatus(key)}
                  aria-pressed={active}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? "border-[#00AFEF]/50 bg-[#00AFEF]/10 text-foreground"
                      : "border-border bg-surface-secondary text-muted hover:text-foreground"
                  }`}
                >
                  {key === "all" ? "All" : STATUS_META[key].label}
                  <span className="rounded-full bg-background px-1.5 py-0.5 text-[10px] font-bold text-muted">{counts[key]}</span>
                </button>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-4 py-12 text-center">
              <Inbox size={28} className="text-muted" aria-hidden="true" />
              <p className="mt-3 text-sm font-medium">
                {tickets.length === 0 ? "No tickets yet" : "No tickets match"}
              </p>
              <p className="mt-1 text-xs text-muted">
                {tickets.length === 0
                  ? "Support requests will appear here when builders submit them."
                  : "Try a different search or filter."}
              </p>
              {hasFilters && tickets.length > 0 && (
                <button type="button" onClick={clearFilters} className="mt-3 text-xs font-medium text-[#00AFEF] hover:underline">
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <ul className="space-y-2 lg:max-h-[calc(100vh-24rem)] lg:overflow-y-auto lg:pr-1">
              {filtered.map((t) => {
                const active = t.id === selectedId;
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(t.id)}
                      aria-current={active ? "true" : undefined}
                      className={`w-full rounded-xl border p-3 text-left transition-colors ${
                        active
                          ? "border-[#00AFEF]/50 bg-[#00AFEF]/5"
                          : "border-border bg-background hover:border-[#00AFEF]/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-semibold">{t.subject}</p>
                        <span className="shrink-0 text-[11px] text-muted">{relativeTime(t.created_at)}</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{t.message}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <StatusPill status={t.status} />
                        <span className="min-w-0 truncate text-[11px] text-muted">{senderLabel(t)}</span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ── Ticket detail ── */}
        <section
          aria-label="Ticket details"
          className={`${selected ? "flex" : "hidden lg:flex"} min-w-0 flex-col rounded-2xl border border-border bg-surface p-5 sm:p-6`}
        >
          {!selected ? (
            <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
              <Inbox size={30} className="text-muted" aria-hidden="true" />
              <p className="mt-3 text-sm font-medium">Select a ticket</p>
              <p className="mt-1 text-xs text-muted">Choose a ticket from the list to read it.</p>
            </div>
          ) : (
            <div className="space-y-5">
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="flex items-center gap-1.5 text-xs font-medium text-muted hover:text-foreground lg:hidden"
              >
                <ArrowLeft size={14} /> Back to tickets
              </button>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill status={selected.status} />
                  <span className="text-[11px] text-muted">Ticket #{selected.id.slice(0, 8)}</span>
                </div>
                <h3 className="text-lg font-bold leading-snug">{selected.subject}</h3>
              </div>

              <dl className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-surface-secondary p-4">
                  <dt className="text-xs text-muted">Sender</dt>
                  <dd className="mt-1 break-words text-sm font-medium">{names[selected.user_id] || "Name unavailable"}</dd>
                  <dd className="mt-0.5 flex items-center gap-1.5 break-all text-xs text-muted">
                    <Mail size={12} className="shrink-0" aria-hidden="true" />
                    {selected.user_email || "Email unavailable"}
                  </dd>
                </div>
                <div className="rounded-xl bg-surface-secondary p-4">
                  <dt className="text-xs text-muted">Submitted</dt>
                  <dd className="mt-1 flex items-center gap-1.5 text-sm font-medium">
                    <CalendarDays size={14} className="shrink-0 text-muted" aria-hidden="true" />
                    {formatDateTime(selected.created_at)}
                  </dd>
                  <dd className="mt-0.5 text-xs text-muted">{relativeTime(selected.created_at)}</dd>
                </div>
              </dl>

              <div>
                <p className="mb-2 text-xs font-medium text-muted">MESSAGE</p>
                <p className="whitespace-pre-wrap break-words rounded-xl border border-border bg-background p-4 text-sm leading-relaxed">
                  {selected.message}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium text-muted">STATUS</p>
                <div role="radiogroup" aria-label="Ticket status" className="grid grid-cols-3 gap-2">
                  {STATUS_ORDER.map((value) => {
                    const active = selected.status === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        disabled={updatingId === selected.id}
                        onClick={() => updateStatus(selected, value)}
                        className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
                          active
                            ? "border-[#00AFEF]/50 bg-[#00AFEF]/10 text-foreground"
                            : "border-border bg-surface-secondary text-muted hover:text-foreground"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${STATUS_META[value].dot}`} aria-hidden="true" />
                        {STATUS_META[value].label}
                      </button>
                    );
                  })}
                </div>
                {updatingId === selected.id && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                    <Loader2 size={12} className="animate-spin" /> Saving...
                  </p>
                )}
              </div>

              {selected.user_email && (
                <a
                  href={`mailto:${selected.user_email}?subject=${encodeURIComponent(`Re: ${selected.subject}`)}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#00AFEF] px-4 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-[#00AFEF]/80"
                >
                  <Mail size={15} />
                  Reply by Email
                </a>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// useSearchParams needs a Suspense boundary for production builds
export default function SupportInboxPage() {
  return (
    <Suspense fallback={<SupportInboxSkeleton />}>
  <SupportInbox />
</Suspense>
  );
}