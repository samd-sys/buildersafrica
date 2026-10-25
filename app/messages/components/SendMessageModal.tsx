"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Send, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Props = {
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
  isOpen: boolean;
  onClose: () => void;
};

export default function SendMessageModal({
  recipientId,
  recipientName,
  recipientAvatar,
  isOpen,
  onClose,
}: Props) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [message, setMessage]     = useState("");
  const [sending, setSending]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => { setIsMounted(true); }, []);
  useEffect(() => {
    if (!isOpen) { setMessage(""); setError(null); }
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSend = async () => {
    if (!message.trim()) { setError("Please write a message."); return; }
    setSending(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated.");

      // Ensure participant_1 < participant_2 for uniqueness constraint
      const p1 = user.id < recipientId ? user.id : recipientId;
      const p2 = user.id < recipientId ? recipientId : user.id;

      // Check if conversation already exists
      const { data: existing } = await supabase
        .from("dm_conversations")
        .select("id, status")
        .eq("participant_1", p1)
        .eq("participant_2", p2)
        .maybeSingle();

      let convId: string;

      if (existing) {
        convId = existing.id;
        // If blocked, don't allow
        if (existing.status === "blocked" && existing) {
          throw new Error("You cannot message this person.");
        }
      } else {
        // Create new conversation as a request
        const { data: newConv, error: convError } = await supabase
          .from("dm_conversations")
          .insert([{
            participant_1: p1,
            participant_2: p2,
            requested_by:  user.id,
            status:        "request",
          }])
          .select("id")
          .single();

        if (convError) throw convError;
        convId = newConv.id;
      }

      // Insert the message
      const { error: msgError } = await supabase.from("dm_messages").insert([{
        conversation_id: convId,
        sender_id:       user.id,
        content:         message.trim(),
        is_read:         false,
      }]);

      if (msgError) throw msgError;

      // Send notification to recipient
      const { data: senderProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single();

      await supabase.from("notifications").insert([{
        user_id:   recipientId,
        title:     "New Message Request",
        message:   `${senderProfile?.full_name || "Someone"} sent you a message request.`,
        type:      "message_request",
        sender_id: user.id,
      }]);

      onClose();
      router.push(`/messages?conv=${convId}`);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  if (!isMounted) return null;

  return createPortal(
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-200 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <div
        className={`fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#1F1F23] bg-[#0F0F11] shadow-2xl transition-all duration-200 ${
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1F1F23] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full overflow-hidden border border-[#27272A] bg-[#18181B] flex items-center justify-center shrink-0">
              {recipientAvatar ? (
                <img src={recipientAvatar} alt={recipientName} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-gray-500">
                  {recipientName.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-white">Message {recipientName}</p>
              <p className="text-xs text-gray-500">This will be sent as a message request</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-300">
              {error}
            </div>
          )}
          <textarea
            rows={4}
            value={message}
            onChange={(e) => { setMessage(e.target.value); setError(null); }}
            placeholder={`Write a message to ${recipientName}...`}
            autoFocus
            className="w-full resize-none rounded-xl border border-[#1F1F23] bg-[#121215] px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-[#00AFEF]/50 transition-colors"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[#1F1F23] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-[#1F1F23] px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!message.trim() || sending}
            className="flex items-center gap-2 rounded-xl bg-[#00AFEF] px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-[#00AFEF]/80 transition-colors disabled:opacity-50"
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {sending ? "Sending..." : "Send Request"}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}