
"use client";

import { X, CornerUpLeft } from "lucide-react";

type Props =
  | {
      // Used inside message bubble (display only)
      mode: "bubble";
      senderName: string;
      content: string;
      isMine: boolean;
    }
  | {
      // Used in message input (composing a reply)
      mode: "input";
      senderName: string;
      content: string;
      onCancel: () => void;
    };

export default function ReplyPreview(props: Props) {
  if (props.mode === "bubble") {
    return (
      <div
        className={`mb-1 max-w-full rounded-xl border-l-2 border-[#00AFEF] px-3 py-2 text-xs ${
          props.isMine
            ? "bg-surface-secondary"
            : "border border-border bg-surface"
        }`}
      >
        <p className="truncate font-semibold text-[#00AFEF]">
          {props.senderName}
        </p>
        <p className="mt-0.5 truncate text-muted">{props.content}</p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#00AFEF]/20 bg-[#00AFEF]/5 px-4 py-2.5">
      <CornerUpLeft size={14} className="shrink-0 text-[#00AFEF]" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-[#00AFEF]">
          Replying to {props.senderName}
        </p>
        <p className="truncate text-xs text-muted">{props.content}</p>
      </div>

      <button
        type="button"
        onClick={props.onCancel}
        aria-label="Cancel reply"
        className="shrink-0 text-muted transition-colors hover:text-foreground"
      >
        <X size={14} />
      </button>
    </div>
  );
}
