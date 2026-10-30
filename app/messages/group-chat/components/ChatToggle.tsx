
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
    <div className="flex items-center rounded-xl border border-border bg-surface-secondary p-1">
      <button
        type="button"
        onClick={() => onChange("private")}
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
          mode === "private"
            ? "bg-surface text-foreground shadow-sm"
            : "text-muted hover:text-foreground"
        }`}
      >
        Chats

        {privateUnread > 0 && (
          <span
            className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
              mode === "private"
                ? "bg-[#00AFEF]/20 text-[#00AFEF]"
                : "bg-surface text-muted"
            }`}
          >
            {privateUnread > 99 ? "99+" : privateUnread}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => onChange("group")}
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
          mode === "group"
            ? "bg-surface text-foreground shadow-sm"
            : "text-muted hover:text-foreground"
        }`}
      >
        Groups

        {groupUnread > 0 && (
          <span
            className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
              mode === "group"
                ? "bg-[#00AFEF]/20 text-[#00AFEF]"
                : "bg-surface text-muted"
            }`}
          >
            {groupUnread > 99 ? "99+" : groupUnread}
          </span>
        )}
      </button>
    </div>
  );
}

export type { ChatMode };
