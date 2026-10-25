import { Check, X, Ban, Loader2 } from "lucide-react";
import { useState } from "react";

type Props = {
  senderName: string;
  onAccept: () => Promise<void>;
  onDecline: () => Promise<void>;
  onBlock: () => Promise<void>;
};

export default function MessageRequestBanner({
  senderName,
  onAccept,
  onDecline,
  onBlock,
}: Props) {
  const [acting, setActing] = useState<"accept" | "decline" | "block" | null>(
    null
  );

  const handle = async (
    type: "accept" | "decline" | "block",
    fn: () => Promise<void>
  ) => {
    setActing(type);
    await fn();
    setActing(null);
  };

  return (
    <div className="shrink-0 border-b border-[#1F1F23] bg-[#00AFEF]/[0.04] px-4 py-4">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00AFEF]/10 border border-[#00AFEF]/20 shrink-0 text-[#00AFEF] text-sm">
          ✉️
        </div>
        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <p className="text-sm font-semibold text-white">
              Message request from {senderName}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Do you want to accept this message request? They will not know you
              declined if you choose not to accept.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handle("accept", onAccept)}
              disabled={!!acting}
              className="flex items-center gap-1.5 rounded-lg bg-[#00AFEF] px-4 py-1.5 text-xs font-semibold text-slate-950 hover:bg-[#00AFEF]/80 transition-colors disabled:opacity-60"
            >
              {acting === "accept" ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Check size={12} />
              )}
              Accept
            </button>
            <button
              onClick={() => handle("decline", onDecline)}
              disabled={!!acting}
              className="flex items-center gap-1.5 rounded-lg border border-[#1F1F23] bg-[#121215] px-4 py-1.5 text-xs font-medium text-gray-400 hover:text-white transition-colors disabled:opacity-60"
            >
              {acting === "decline" ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <X size={12} />
              )}
              Decline
            </button>
            <button
              onClick={() => handle("block", onBlock)}
              disabled={!!acting}
              className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-60"
            >
              {acting === "block" ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Ban size={12} />
              )}
              Block
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}