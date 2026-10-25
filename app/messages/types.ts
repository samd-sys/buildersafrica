export type ConversationStatus = "request" | "accepted" | "declined" | "blocked";

export type DMConversation = {
  id: string;
  participant_1: string;
  participant_2: string;
  status: ConversationStatus;
  requested_by: string;
  created_at: string;
  // Joined
  otherUser: {
    user_id: string;
    full_name: string;
    avatar_url: string;
    professional_title: string;
  };
  lastMessage?: {
    content: string | null;
    file_name: string | null;
    created_at: string;
    sender_id: string;
    deleted_at: string | null;
  };
  unreadCount: number;
};

export type DMMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  file_url: string | null;
  file_type: string | null;
  file_name: string | null;
  file_size: number | null;
  is_read: boolean;
  deleted_at: string | null;
  created_at: string;
};

export const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function isImageType(type: string | null): boolean {
  return !!type && type.startsWith("image/");
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) {
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7)
    return date.toLocaleDateString("en-GB", { weekday: "short" });
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}