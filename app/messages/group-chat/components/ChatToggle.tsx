type ChatMode = "private" | "group";

type Props = {
  mode: ChatMode;
  onChange: (mode: ChatMode) => void;
  groupUnread: number;
  privateUnread: number;
};

export default function ChatToggle({
  mode,
  onChange,
  groupUnread,
  privateUnread,
}: Props) {
  return (
    <div className="flex items-center rounded-xl border border-[#1F1F23] bg-[#121215] p-1">
      <button
        onClick={() => onChange("private")}
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
          mode === "private"
            ? "bg-[#1F1F23] text-white"
            : "text-gray-500 hover:text-gray-300"
        }`}
      >
        chats
        {privateUnread > 0 && (
          <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
            mode === "private"
              ? "bg-[#00AFEF]/20 text-[#00AFEF]"
              : "bg-white/5 text-gray-600"
          }`}>
            {privateUnread > 99 ? "99+" : privateUnread}
          </span>
        )}
      </button>

      <button
        onClick={() => onChange("group")}
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
          mode === "group"
            ? "bg-[#1F1F23] text-white"
            : "text-gray-500 hover:text-gray-300"
        }`}
      >
        Groups
        {groupUnread > 0 && (
          <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
            mode === "group"
              ? "bg-[#00AFEF]/20 text-[#00AFEF]"
              : "bg-white/5 text-gray-600"
          }`}>
            {groupUnread > 99 ? "99+" : groupUnread}
          </span>
        )}
      </button>
    </div>
  );
}

export type { ChatMode };