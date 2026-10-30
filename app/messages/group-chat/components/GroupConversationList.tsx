
import { BellOff, Users } from "lucide-react";
import { GroupConversation, formatGroupTime } from "../groupTypes";

type Props = {
  conversations: GroupConversation[];
  activeId: string | null;
  onSelect: (conv: GroupConversation) => void;
};

export default function GroupConversationList({
  conversations,
  activeId,
  onSelect,
}: Props) {
  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
          <Users size={28} className="text-muted" />
          <p className="text-xs text-muted">
            No group chats yet. Join a project team to get started.
          </p>
        </div>
      ) : (
        conversations.map((conv) => {
          const isActive = activeId === conv.id;
          const last = conv.lastMessage;

          const lastText = last
            ? last.deleted_at
              ? "Message deleted"
              : last.content
              ? `${last.sender_name}: ${last.content}`
              : last.attachment_url
              ? `${last.sender_name}: 📎 Attachment`
              : ""
            : "No messages yet";

          return (
            <button
              key={conv.id}
              type="button"
              onClick={() => onSelect(conv)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                isActive
                  ? "border-r-2 border-[#00AFEF] bg-[#00AFEF]/10"
                  : "hover:bg-surface-secondary"
              }`}
            >
              {/* Project logo */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface-secondary">
                {conv.projectLogo ? (
                  <img
                    src={conv.projectLogo}
                    alt={conv.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-black text-muted">
                    {conv.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <p
                      className={`truncate text-sm font-semibold ${
                        isActive ? "text-foreground" : "text-foreground"
                      }`}
                    >
                      {conv.name}
                    </p>

                    {conv.isMuted && (
                      <BellOff
                        size={11}
                        className="shrink-0 text-muted"
                      />
                    )}
                  </div>

                  {last && (
                    <span className="shrink-0 text-[10px] text-muted">
                      {formatGroupTime(last.created_at)}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs text-muted">{lastText}</p>

                  {conv.unreadCount > 0 && !conv.isMuted && (
                    <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-[#00AFEF] px-1 text-[9px] font-bold text-white">
                      {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                    </span>
                  )}

                  {conv.unreadCount > 0 && conv.isMuted && (
                    <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-surface-secondary px-1 text-[9px] font-bold text-muted">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })
      )}
    </div>
  );
}
