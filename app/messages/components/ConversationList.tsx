
"use client";

import { useState } from "react";
import { Search, MessageSquare } from "lucide-react";
import { DMConversation, formatMessageTime } from "../types";

type Props = {
  conversations: DMConversation[];
  activeId: string | null;
  currentUserId: string;
  onSelect: (conv: DMConversation) => void;
};

function Avatar({
  url,
  name,
  size = 10,
}: {
  url: string;
  name: string;
  size?: number;
}) {
  return (
    <div
      className={`h-${size} w-${size} rounded-full overflow-hidden border border-border bg-surface-secondary flex items-center justify-center shrink-0`}
    >
      {url ? (
        <img src={url} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span className="text-xs font-bold text-muted">
          {name?.slice(0, 2).toUpperCase() || "?"}
        </span>
      )}
    </div>
  );
}

function ConvItem({
  conv,
  isActive,
  currentUserId,
  onClick,
}: {
  conv: DMConversation;
  isActive: boolean;
  currentUserId: string;
  onClick: () => void;
}) {
  const other = conv.otherUser;
  const last = conv.lastMessage;
  const isRequest = conv.status === "request";
  const isBlocked = conv.status === "blocked";

  const lastText = last
    ? last.deleted_at
      ? "Message deleted"
      : last.content || (last.file_name ? `📎 ${last.file_name}` : "")
    : isRequest
      ? "Message request"
      : "No messages yet";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
        isActive
          ? "bg-[#00AFEF]/10 border-r-2 border-[#00AFEF]"
          : "hover:bg-surface-secondary/70"
      }`}
    >
      <div className="relative shrink-0">
        <div className="h-10 w-10 rounded-full overflow-hidden border border-border bg-surface-secondary flex items-center justify-center">
          {other.avatar_url ? (
            <img
              src={other.avatar_url}
              alt={other.full_name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xs font-bold text-muted">
              {other.full_name?.slice(0, 2).toUpperCase() || "?"}
            </span>
          )}
        </div>

        {isRequest && (
          <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-[#00AFEF] border-2 border-surface" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p
            className={`text-sm font-semibold truncate ${
              isActive ? "text-foreground" : "text-foreground/85"
            }`}
          >
            {other.full_name || "Unknown"}
          </p>

          {last && (
            <span className="text-[10px] text-muted shrink-0">
              {formatMessageTime(last.created_at)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted truncate">
            {isRequest ? (
              <span className="text-[#00AFEF]">Message request</span>
            ) : isBlocked ? (
              <span className="text-red-400/80">Blocked</span>
            ) : (
              lastText
            )}
          </p>

          {conv.unreadCount > 0 && !isRequest && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#00AFEF] px-1 text-[9px] font-bold text-white shrink-0">
              {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export default function ConversationList({
  conversations,
  activeId,
  currentUserId,
  onSelect,
}: Props) {
  const [search, setSearch] = useState("");

  const filtered = conversations.filter((c) =>
    c.otherUser.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const requests = filtered.filter(
    (c) => c.status === "request" && c.requested_by !== currentUserId
  );

  const accepted = filtered.filter((c) => c.status === "accepted");

  const sent = filtered.filter(
    (c) => c.status === "request" && c.requested_by === currentUserId
  );

  return (
    <div className="flex flex-col h-full border-r border-border bg-surface">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border space-y-3 shrink-0">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-secondary px-3 py-2 focus-within:border-[#00AFEF]/40 transition-colors">
          <Search size={13} className="text-muted shrink-0" />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted outline-none"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 px-4 text-center">
            <MessageSquare size={28} className="text-muted" />
            <p className="text-xs text-muted">No conversations yet</p>
          </div>
        ) : (
          <>
            {/* Message Requests */}
            {requests.length > 0 && (
              <div>
                <p className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#00AFEF]">
                  Requests ({requests.length})
                </p>

                {requests.map((c) => (
                  <ConvItem
                    key={c.id}
                    conv={c}
                    isActive={activeId === c.id}
                    currentUserId={currentUserId}
                    onClick={() => onSelect(c)}
                  />
                ))}
              </div>
            )}

            {/* Accepted */}
            {accepted.length > 0 && (
              <div>
                {requests.length > 0 && (
                  <p className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
                    Messages
                  </p>
                )}

                {accepted.map((c) => (
                  <ConvItem
                    key={c.id}
                    conv={c}
                    isActive={activeId === c.id}
                    currentUserId={currentUserId}
                    onClick={() => onSelect(c)}
                  />
                ))}
              </div>
            )}

            {/* Sent requests */}
            {sent.length > 0 && (
              <div>
                <p className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Sent Requests
                </p>

                {sent.map((c) => (
                  <ConvItem
                    key={c.id}
                    conv={c}
                    isActive={activeId === c.id}
                    currentUserId={currentUserId}
                    onClick={() => onSelect(c)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
