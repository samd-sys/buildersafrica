
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  LayoutDashboard,
  LifeBuoy,
  Users,
  FolderKanban,
  Search,
  RefreshCw,
  Loader2,
  ShieldCheck,
  Clock3,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ChevronDown,
  Mail,
  CalendarDays,
  X,
} from "lucide-react";

type TicketStatus = "open" | "in_progress" | "resolved";

type SupportTicket = {
  id: string;
  user_id: string;
  user_email: string | null;
  subject: string;
  message: string;
  status: TicketStatus;
  created_at: string;
};

const STATUS_OPTIONS: {
  value: TicketStatus;
  label: string;
}[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
];

export default function AdminDashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] =
    useState<SupportTicket | null>(null);
  const [updatingTicket, setUpdatingTicket] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      // Verify authenticated user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/login");
        return;
      }

      // Verify admin membership
      const { data: admin, error: adminError } = await supabase
        .from("support_admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (adminError || !admin) {
        router.replace("/projects");
        return;
      }

      // Retrieve support tickets
      const { data, error: ticketError } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (ticketError) {
        throw ticketError;
      }

      setTickets((data || []) as SupportTicket[]);
    } catch (err) {
      console.error("Admin dashboard error:", err);
      setError("Unable to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Update ticket status
  const updateTicketStatus = async (
    ticketId: string,
    newStatus: TicketStatus
  ) => {
    setUpdatingTicket(ticketId);
    setError("");

    try {
      const { error: updateError } = await supabase
        .from("support_tickets")
        .update({ status: newStatus })
        .eq("id", ticketId);

      if (updateError) {
        throw updateError;
      }

      setTickets((previous) =>
        previous.map((ticket) =>
          ticket.id === ticketId
            ? { ...ticket, status: newStatus }
            : ticket
        )
      );

      setSelectedTicket((previous) =>
        previous?.id === ticketId
          ? { ...previous, status: newStatus }
          : previous
      );
    } catch (err) {
      console.error("Ticket update error:", err);
      setError("Could not update ticket status. Please try again.");
    } finally {
      setUpdatingTicket(null);
    }
  };

  // Ticket statistics
  const stats = useMemo(() => ({
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    inProgress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
  }), [tickets]);

  // Search and filter tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesStatus =
        statusFilter === "all" || ticket.status === statusFilter;

      const searchText = search.toLowerCase();

      const matchesSearch =
        ticket.subject.toLowerCase().includes(searchText) ||
        ticket.message.toLowerCase().includes(searchText) ||
        (ticket.user_email || "").toLowerCase().includes(searchText);

      return matchesStatus && matchesSearch;
    });
  }, [tickets, search, statusFilter]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleString("en-KE", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  const statusStyle = (status: TicketStatus) => {
    switch (status) {
      case "open":
        return "border-amber-500/20 bg-amber-500/10 text-amber-400";
      case "in_progress":
        return "border-blue-500/20 bg-blue-500/10 text-blue-400";
      case "resolved":
        return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";
    }
  };

  const statusLabel = (status: TicketStatus) =>
    STATUS_OPTIONS.find((option) => option.value === status)?.label || status;

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-[#00AFEF]" size={30} />
          <p className="text-sm text-muted">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen space-y-8 bg-background p-5 text-foreground sm:p-8">

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#00AFEF]">
            <ShieldCheck size={15} />
            ADMINISTRATION
          </div>

          <h1 className="text-2xl font-bold tracking-tight">
            Admin Dashboard
          </h1>

          <p className="mt-1 text-sm text-muted">
            Manage and monitor your BuildersAfrica platform.
          </p>
        </div>

        <button
          onClick={() => loadDashboard(true)}
          disabled={refreshing}
          className="flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium transition-colors hover:bg-surface-secondary disabled:opacity-50"
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
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Navigation overview */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "Overview",
            icon: LayoutDashboard,
            active: false,
          },
          {
            label: "Support Inbox",
            icon: LifeBuoy,
            active: true,
          },
          {
            label: "Users",
            icon: Users,
            active: false,
          },
          {
            label: "Projects",
            icon: FolderKanban,
            active: false,
          },
        ].map((item) => (
          <div
            key={item.label}
            className={`flex items-center gap-3 rounded-xl border p-4 ${
              item.active
                ? "border-[#00AFEF]/30 bg-[#00AFEF]/5"
                : "border-border bg-surface"
            }`}
          >
            <item.icon
              size={18}
              className={item.active ? "text-[#00AFEF]" : "text-muted"}
            />
            <span className="text-sm font-medium">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Statistics */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "Total Tickets",
            value: stats.total,
            icon: MessageSquare,
            color: "text-[#00AFEF]",
          },
          {
            label: "Open",
            value: stats.open,
            icon: AlertCircle,
            color: "text-amber-400",
          },
          {
            label: "In Progress",
            value: stats.inProgress,
            icon: Clock3,
            color: "text-blue-400",
          },
          {
            label: "Resolved",
            value: stats.resolved,
            icon: CheckCircle2,
            color: "text-emerald-400",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-border bg-surface p-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted">{stat.label}</p>
              <stat.icon size={18} className={stat.color} />
            </div>
            <p className="mt-3 text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </section>

      {/* Support Inbox */}
      <section className="space-y-5 rounded-2xl border border-border bg-surface p-5 sm:p-6">

        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <LifeBuoy size={18} className="text-[#00AFEF]" />
              <h2 className="text-lg font-semibold">Support Inbox</h2>
            </div>
            <p className="mt-1 text-xs text-muted">
              Review and manage support requests from builders.
            </p>
          </div>

          <span className="text-xs text-muted">
            {filteredTickets.length} of {tickets.length} tickets
          </span>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subject, message or email..."
              className="w-full rounded-xl border border-border bg-surface-secondary py-3 pl-10 pr-4 text-sm outline-none transition-colors focus:border-[#00AFEF]/60"
            />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none rounded-xl border border-border bg-surface-secondary px-4 py-3 pr-10 text-sm outline-none focus:border-[#00AFEF]/60 sm:w-48"
            >
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
            <ChevronDown
              size={15}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
            />
          </div>
        </div>

        {/* Tickets */}
        {filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
            <MessageSquare size={30} className="text-muted" />
            <p className="mt-3 text-sm font-medium">No tickets found</p>
            <p className="mt-1 text-xs text-muted">
              Support requests will appear here when builders submit them.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="rounded-xl border border-border bg-background p-4 transition-colors hover:border-[#00AFEF]/30"
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <button
                    onClick={() => setSelectedTicket(ticket)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold">
                        {ticket.subject}
                      </h3>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${statusStyle(ticket.status)}`}
                      >
                        {statusLabel(ticket.status)}
                      </span>
                    </div>

                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted">
                      {ticket.message}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted">
                      <span className="flex items-center gap-1.5">
                        <Mail size={12} />
                        {ticket.user_email || "Email unavailable"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CalendarDays size={12} />
                        {formatDate(ticket.created_at)}
                      </span>
                    </div>
                  </button>

                  <div className="flex items-center gap-2 sm:w-40">
                    <select
                      value={ticket.status}
                      disabled={updatingTicket === ticket.id}
                      onChange={(e) =>
                        updateTicketStatus(
                          ticket.id,
                          e.target.value as TicketStatus
                        )
                      }
                      className="w-full rounded-lg border border-border bg-surface-secondary px-2.5 py-2 text-xs outline-none focus:border-[#00AFEF]/60 disabled:opacity-50"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    {updatingTicket === ticket.id && (
                      <Loader2
                        size={14}
                        className="shrink-0 animate-spin text-[#00AFEF]"
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Ticket details modal */}
      {selectedTicket && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setSelectedTicket(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-[#00AFEF]">
                  SUPPORT REQUEST
                </p>
                <h2 className="mt-2 text-lg font-bold">
                  {selectedTicket.subject}
                </h2>
              </div>

              <button
                onClick={() => setSelectedTicket(null)}
                className="rounded-lg p-2 text-muted hover:bg-surface-secondary hover:text-foreground"
                aria-label="Close ticket details"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-xl bg-surface-secondary p-4">
                <p className="text-xs text-muted">Sender</p>
                <p className="mt-1 break-all text-sm font-medium">
                  {selectedTicket.user_email || "Email unavailable"}
                </p>
              </div>

              <div className="rounded-xl bg-surface-secondary p-4">
                <p className="text-xs text-muted">Submitted</p>
                <p className="mt-1 text-sm">
                  {formatDate(selectedTicket.created_at)}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium text-muted">
                  MESSAGE
                </p>
                <p className="whitespace-pre-wrap break-words rounded-xl border border-border bg-background p-4 text-sm leading-relaxed">
                  {selectedTicket.message}
                </p>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-muted">
                  TICKET STATUS
                </label>
                <select
                  value={selectedTicket.status}
                  disabled={updatingTicket === selectedTicket.id}
                  onChange={(e) =>
                    updateTicketStatus(
                      selectedTicket.id,
                      e.target.value as TicketStatus
                    )
                  }
                  className="w-full rounded-xl border border-border bg-surface-secondary px-4 py-3 text-sm outline-none focus:border-[#00AFEF]/60 disabled:opacity-50"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {selectedTicket.user_email && (
                <a
                  href={`mailto:${selectedTicket.user_email}?subject=${encodeURIComponent(`Re: ${selectedTicket.subject}`)}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#00AFEF] px-4 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-[#00AFEF]/80"
                >
                  <Mail size={15} />
                  Reply by Email
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
