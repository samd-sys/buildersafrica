
"use client";

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
    <div className="shrink-0 border-b border-border bg-[#00AFEF]/[0.04] px-4 py-4">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#00AFEF]/20 bg-[#00AFEF]/10 text-sm text-[#00AFEF]">
          ✉️
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Message request from {senderName}
            </p>

            <p className="mt-0.5 text-xs text-muted">
              Do you want to accept this message request? They will not know you
              declined if you choose not to accept.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handle("accept", onAccept)}
              disabled={!!acting}
              className="flex items-center gap-1.5 rounded-lg bg-[#00AFEF] px-4 py-1.5 text-xs font-semibold text-slate-950 transition-colors hover:bg-[#00AFEF]/80 disabled:opacity-60"
            >
              {acting === "accept" ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Check size={12} />
              )}
              Accept
            </button>

            <button
              type="button"
              onClick={() => handle("decline", onDecline)}
              disabled={!!acting}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-secondary px-4 py-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground disabled:opacity-60"
            >
              {acting === "decline" ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <X size={12} />
              )}
              Decline
            </button>

            <button
              type="button"
              onClick={() => handle("block", onBlock)}
              disabled={!!acting}
              className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-60"
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
