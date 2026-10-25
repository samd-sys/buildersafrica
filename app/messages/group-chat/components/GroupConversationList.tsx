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
        <div className="flex flex-col items-center justify-center gap-3 py-16 px-4 text-center">
          <Users size={28} className="text-gray-700" />
          <p className="text-xs text-gray-500">
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
              onClick={() => onSelect(conv)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                isActive
                  ? "bg-[#00AFEF]/10 border-r-2 border-[#00AFEF]"
                  : "hover:bg-white/[0.03]"
              }`}
            >
              {/* Project logo */}
              <div className="h-10 w-10 rounded-xl border border-[#27272A] bg-[#18181B] overflow-hidden flex items-center justify-center shrink-0">
                {conv.projectLogo ? (
                  <img
                    src={conv.projectLogo}
                    alt={conv.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-black text-white/20">
                    {conv.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className={`text-sm font-semibold truncate ${
                      isActive ? "text-white" : "text-gray-200"
                    }`}>
                      {conv.name}
                    </p>
                    {conv.isMuted && (
                      <BellOff size={11} className="text-gray-600 shrink-0" />
                    )}
                  </div>
                  {last && (
                    <span className="text-[10px] text-gray-600 shrink-0">
                      {formatGroupTime(last.created_at)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-gray-500 truncate">{lastText}</p>
                  {conv.unreadCount > 0 && !conv.isMuted && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#00AFEF] px-1 text-[9px] font-bold text-white shrink-0">
                      {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                    </span>
                  )}
                  {conv.unreadCount > 0 && conv.isMuted && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-white/10 px-1 text-[9px] font-bold text-gray-500 shrink-0">
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