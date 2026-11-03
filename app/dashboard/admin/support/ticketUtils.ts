export type TicketStatus = "open" | "in_progress" | "resolved";
export type StatusFilter = TicketStatus | "all";

export type SupportTicket = {
  id: string;
  user_id: string;
  user_email: string | null;
  subject: string;
  message: string;
  status: TicketStatus;
  created_at: string;
};

export const STATUS_ORDER: TicketStatus[] = ["open", "in_progress", "resolved"];

// The dot carries the colour; the label stays in the theme's text colour,
// so it reads in both light and dark mode.
export const STATUS_META: Record<TicketStatus, { label: string; dot: string }> = {
  open: { label: "Open", dot: "bg-amber-500" },
  in_progress: { label: "In Progress", dot: "bg-blue-500" },
  resolved: { label: "Resolved", dot: "bg-emerald-500" },
};

// Same subjects as the Contact Support form in Profile > Support Center
export const KNOWN_SUBJECTS = [
  "Bug Report",
  "Account Issue",
  "Billing Question",
  "Feature Request",
  "Content Issue",
  "Other",
];

export function isTicketStatus(value: string | null | undefined): value is TicketStatus {
  return value === "open" || value === "in_progress" || value === "resolved";
}

export type TicketFilters = {
  status: StatusFilter;
  subject: string; // "all" or an exact subject
  query: string;
};

/** Status + subject filters, then a case-insensitive search over subject, message, email and sender name. */
export function filterTickets(
  tickets: SupportTicket[],
  filters: TicketFilters,
  names: Record<string, string> = {}
): SupportTicket[] {
  const q = filters.query.trim().toLowerCase();
  return tickets.filter((t) => {
    if (filters.status !== "all" && t.status !== filters.status) return false;
    if (filters.subject !== "all" && t.subject !== filters.subject) return false;
    if (!q) return true;
    const haystack = [t.subject, t.message, t.user_email ?? "", names[t.user_id] ?? ""]
      .join("\n")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function countByStatus(tickets: SupportTicket[]): Record<StatusFilter, number> {
  const counts: Record<StatusFilter, number> = {
    all: tickets.length,
    open: 0,
    in_progress: 0,
    resolved: 0,
  };
  for (const t of tickets) counts[t.status] += 1;
  return counts;
}

/** The known subjects first, then any other subject found in the data. */
export function subjectOptions(tickets: SupportTicket[]): string[] {
  const extra = [...new Set(tickets.map((t) => t.subject))]
    .filter((s) => !KNOWN_SUBJECTS.includes(s))
    .sort((a, b) => a.localeCompare(b));
  return [...KNOWN_SUBJECTS, ...extra];
}

export function relativeTime(iso: string, now: number = Date.now()): string {
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return "";
  const minutes = Math.floor((now - time) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" });
}