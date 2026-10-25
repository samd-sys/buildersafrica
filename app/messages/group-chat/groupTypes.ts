export type GroupConversation = {
  id: string;
  name: string;
  project_id: string;
  created_by: string;
  created_at: string;
  // Joined
  projectLogo: string;
  lastMessage?: {
    content: string | null;
    attachment_url: string | null;
    sender_name: string;
    created_at: string;
    deleted_at: string | null;
  };
  unreadCount: number;
  isMuted: boolean;
};

export type GroupMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  attachment_url: string | null;
  attachment_type: string | null;
  is_read: boolean;
  deleted_at: string | null;
  created_at: string;
  // Joined
  senderName: string;
  senderAvatar: string;
};

export function formatGroupTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now  = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 0)
    return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7)
    return date.toLocaleDateString("en-GB", { weekday: "short" });
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}