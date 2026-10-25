export type NotificationType =
  | "project_like" | "project_star" | "project_comment"
  | "project_milestone" | "project_featured"
  | "invite" | "invitation_accepted" | "invitation_declined"
  | "member_joined" | "member_removed" | "role_changed" | "connection_request"
  | "application" | "application_accepted" | "application_rejected"
  | "interview_requested" | "application_cancelled"
  | "like" | "follow" | "mention" | "comment" | "achievement" | "trending"
  | string;

export type NotificationTab = "projects" | "teams" | "applications" | "activity";

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  related_project_id: string | null;
  sender_id: string | null;
  created_at: string;
};

export type RetentionOption = {
  label: string;
  days: number;
};

export const RETENTION_OPTIONS: RetentionOption[] = [
  { label: "24 Hours",  days: 1   },
  { label: "7 Days",   days: 7   },
  { label: "30 Days",  days: 30  },
  { label: "90 Days",  days: 90  },
  { label: "1 Year",   days: 365 },
];

export const TABS: { key: NotificationTab; label: string; emoji: string }[] = [
  { key: "projects",     label: "Projects",     emoji: "🚀" },
  { key: "teams",        label: "Teams",        emoji: "👥" },
  { key: "applications", label: "Applications", emoji: "📋" },
  { key: "activity",     label: "Activity",     emoji: "⚡" },
];

// Maps a notification type string to which tab it belongs to
export function getTab(type: NotificationType): NotificationTab {
  if ([
    "project_like", "project_star", "project_comment",
    "project_milestone", "project_featured",
  ].includes(type)) return "projects";

  if ([
    "invite", "invitation_accepted", "invitation_declined",
    "member_joined", "member_removed", "role_changed", "connection_request",
  ].includes(type)) return "teams";

  if ([
    "application", "application_accepted", "application_rejected",
    "interview_requested", "application_cancelled",
  ].includes(type)) return "applications";

  return "activity";
}

// Returns true for notification types that should NEVER auto-delete
export function isImportant(type: NotificationType): boolean {
  return getTab(type) !== "activity";
}

// Type-specific display config
export const TYPE_META: Record<string, { icon: string; color: string }> = {
  // Projects
  project_like:        { icon: "❤️",  color: "text-rose-400 bg-rose-400/10 border-rose-400/20" },
  project_star:        { icon: "⭐",  color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
  project_comment:     { icon: "💬",  color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  project_milestone:   { icon: "🏆",  color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
  project_featured:    { icon: "✨",  color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  // Teams
  invite:              { icon: "📨",  color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
  invitation_accepted: { icon: "✅",  color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  invitation_declined: { icon: "❌",  color: "text-red-400 bg-red-400/10 border-red-400/20" },
  member_joined:       { icon: "🎉",  color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  member_removed:      { icon: "👋",  color: "text-gray-400 bg-gray-400/10 border-gray-400/20" },
  role_changed:        { icon: "🔄",  color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  connection_request:  { icon: "🤝",  color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
  // Applications
  application:           { icon: "📋", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  application_accepted:  { icon: "🎉", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  application_rejected:  { icon: "😔", color: "text-red-400 bg-red-400/10 border-red-400/20" },
  interview_requested:   { icon: "📅", color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
  application_cancelled: { icon: "🚫", color: "text-gray-400 bg-gray-400/10 border-gray-400/20" },
  // Activity
  like:        { icon: "❤️", color: "text-rose-400 bg-rose-400/10 border-rose-400/20" },
  follow:      { icon: "👤", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  mention:     { icon: "💬", color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
  comment:     { icon: "💬", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  achievement: { icon: "🏅", color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  trending:    { icon: "📈", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
};

export const DEFAULT_META = { icon: "🔔", color: "text-gray-400 bg-gray-400/10 border-gray-400/20" };