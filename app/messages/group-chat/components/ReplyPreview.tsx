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
        className={`mb-1 rounded-xl border-l-2 border-[#00AFEF] px-3 py-2 text-xs max-w-full ${
          props.isMine
            ? "bg-white/10"
            : "bg-[#0F0F11] border border-[#1F1F23]"
        }`}
      >
        <p className="font-semibold text-[#00AFEF] truncate">{props.senderName}</p>
        <p className="text-gray-400 truncate mt-0.5">{props.content}</p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#00AFEF]/20 bg-[#00AFEF]/5 px-4 py-2.5">
      <CornerUpLeft size={14} className="text-[#00AFEF] shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[#00AFEF] truncate">
          Replying to {props.senderName}
        </p>
        <p className="text-xs text-gray-400 truncate">{props.content}</p>
      </div>
      <button
        onClick={props.onCancel}
        className="text-gray-500 hover:text-white transition-colors shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  );
}