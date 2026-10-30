
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  DMConversation,
  DMMessage,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
} from "../types";
import MessageBubble from "./MessageBubble";
import MessageInput, { ReplyTo } from "./MessageInput";
import MessageRequestBanner from "./MessageRequestBanner";
import { Loader2, User } from "lucide-react";

type Props = {
  conversation: DMConversation;
  currentUserId: string;
  onStatusChange: (
    id: string,
    status: "accepted" | "declined" | "blocked"
  ) => void;
};

export default function ChatWindow({
  conversation: conv,
  currentUserId,
  onStatusChange,
}: Props) {
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [replyTo, setReplyTo] = useState<ReplyTo | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isRequest = conv.status === "request";
  const isBlocked = conv.status === "blocked";
  const isDeclined = conv.status === "declined";
  const iAmRequester = conv.requested_by === currentUserId;
  const showBanner = isRequest && !iAmRequester;
  const canSend = conv.status === "accepted";

  const scrollToBottom = () =>
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });

  const markAsRead = useCallback(async () => {
    await supabase
      .from("dm_messages")
      .update({ is_read: true })
      .eq("conversation_id", conv.id)
      .eq("is_read", false)
      .neq("sender_id", currentUserId);

    setMessages((prev) =>
      prev.map((m) =>
        !m.is_read && m.sender_id !== currentUserId
          ? { ...m, is_read: true }
          : m
      )
    );
  }, [conv.id, currentUserId]);

  const loadMessages = useCallback(async () => {
    setLoading(true);

    const { data } = await supabase
      .from("dm_messages")
      .select("*, reply_to_id, reply_to_content, reply_to_sender")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: true });

    setMessages(data || []);
    setLoading(false);
  }, [conv.id]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!loading) {
      scrollToBottom();
      markAsRead();
    }
  }, [loading]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  // Real-time
  useEffect(() => {
    const channel = supabase
      .channel(`dm-messages-${conv.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "dm_messages",
          filter: `conversation_id=eq.${conv.id}`,
        },
        (payload: any) => {
          if (payload.eventType === "INSERT") {
            const newMsg = payload.new as DMMessage;

            setMessages((prev) => {
              if (prev.find((m) => m.id === newMsg.id)) return prev;

              return [
                ...prev,
                {
                  ...newMsg,
                  is_read:
                    newMsg.sender_id !== currentUserId
                      ? true
                      : newMsg.is_read,
                },
              ];
            });

            if (newMsg.sender_id !== currentUserId) {
              supabase
                .from("dm_messages")
                .update({ is_read: true })
                .eq("id", newMsg.id);
            }
          }

          if (payload.eventType === "UPDATE") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === payload.new.id
                  ? (payload.new as DMMessage)
                  : m
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conv.id, currentUserId]);

  const handleSend = async (
    content: string,
    file?: File,
    reply?: ReplyTo
  ) => {
    let fileUrl: string | null = null;
    let fileType: string | null = null;
    let fileName: string | null = null;
    let fileSize: number | null = null;

    if (file) {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        alert("File type not supported.");
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        alert("File too large. Maximum size is 10MB.");
        return;
      }

      const ext = file.name.split(".").pop();
      const path = `${conv.id}/${currentUserId}-${Date.now()}.${ext}`;

      setUploadProgress(0);

      const { error: uploadError } = await supabase.storage
        .from("messages")
        .upload(path, file, { upsert: false });

      setUploadProgress(null);

      if (uploadError) {
        alert("Upload failed: " + uploadError.message);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("messages").getPublicUrl(path);

      fileUrl = publicUrl;
      fileType = file.type;
      fileName = file.name;
      fileSize = file.size;
    }

    if (!content && !fileUrl) return;

    await supabase.from("dm_messages").insert([
      {
        conversation_id: conv.id,
        sender_id: currentUserId,
        content: content || null,
        file_url: fileUrl,
        file_type: fileType,
        file_name: fileName,
        file_size: fileSize,
        is_read: false,
        reply_to_id: reply?.id || null,
        reply_to_content: reply?.content || null,
        reply_to_sender: reply?.senderName || null,
      },
    ]);

    setReplyTo(null);
  };

  const handleDelete = async (id: string) => {
    await supabase
      .from("dm_messages")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
  };

  const handleAccept = async () => {
    await supabase
      .from("dm_conversations")
      .update({ status: "accepted" })
      .eq("id", conv.id);

    onStatusChange(conv.id, "accepted");
  };

  const handleDecline = async () => {
    await supabase
      .from("dm_conversations")
      .update({ status: "declined" })
      .eq("id", conv.id);

    onStatusChange(conv.id, "declined");
  };

  const handleBlock = async () => {
    await supabase
      .from("dm_conversations")
      .update({ status: "blocked" })
      .eq("id", conv.id);

    onStatusChange(conv.id, "blocked");
  };

  const other = conv.otherUser;
  let lastDate = "";

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border bg-surface px-5 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-secondary">
          {other.avatar_url ? (
            <img
              src={other.avatar_url}
              alt={other.full_name}
              className="h-full w-full object-cover"
            />
          ) : (
            <User size={16} className="text-muted" />
          )}
        </div>

        <div>
          <p className="text-sm font-semibold text-foreground">
            {other.full_name}
          </p>

          {other.professional_title && (
            <p className="text-xs text-muted">
              {other.professional_title}
            </p>
          )}
        </div>

        {conv.status !== "accepted" && (
          <span
            className={`ml-auto rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize ${
              isRequest
                ? "border-[#00AFEF]/20 bg-[#00AFEF]/10 text-[#00AFEF]"
                : isBlocked
                  ? "border-red-500/20 bg-red-500/10 text-red-400"
                  : isDeclined
                    ? "border-border bg-surface-secondary text-muted"
                    : ""
            }`}
          >
            {conv.status}
          </span>
        )}
      </div>

      {/* Request banner */}
      {showBanner && (
        <MessageRequestBanner
          senderName={other.full_name}
          onAccept={handleAccept}
          onDecline={handleDecline}
          onBlock={handleBlock}
        />
      )}

      {/* Messages */}
      <div className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2
              size={24}
              className="animate-spin text-[#00AFEF]"
            />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-secondary">
              {other.avatar_url ? (
                <img
                  src={other.avatar_url}
                  alt={other.full_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User size={24} className="text-muted" />
              )}
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground">
                {other.full_name}
              </p>

              <p className="mt-1 text-xs text-muted">
                {isRequest && iAmRequester
                  ? "Your message request is pending."
                  : "Say hello!"}
              </p>
            </div>
          </div>
        ) : (
          messages.map((m, i) => {
            const msgDate = new Date(m.created_at).toLocaleDateString(
              "en-GB",
              {
                day: "numeric",
                month: "long",
                year: "numeric",
              }
            );

            const showDate = msgDate !== lastDate;
            lastDate = msgDate;

            const isMine = m.sender_id === currentUserId;
            const isLastMine =
              isMine &&
              (i === messages.length - 1 ||
                messages[i + 1]?.sender_id !== currentUserId);

            return (
              <div key={m.id}>
                {showDate && (
                  <div className="my-4 flex items-center gap-3">
                    <div className="h-px flex-1 bg-border" />
                    <span className="shrink-0 text-[10px] text-muted">
                      {msgDate}
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                )}

                <MessageBubble
                  message={m as any}
                  isMine={isMine}
                  isLastMine={isLastMine}
                  onDelete={handleDelete}
                  onReply={(msg) =>
                    setReplyTo({
                      id: msg.id,
                      senderName: isMine ? "You" : other.full_name,
                      content:
                        msg.content ||
                        (msg.file_name ? `📎 ${msg.file_name}` : ""),
                    })
                  }
                />
              </div>
            );
          })
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {isBlocked ? (
        <div className="shrink-0 border-t border-border bg-surface px-4 py-4 text-center text-xs text-muted">
          You have blocked this conversation.
        </div>
      ) : isDeclined ? (
        <div className="shrink-0 border-t border-border bg-surface px-4 py-4 text-center text-xs text-muted">
          This message request was declined.
        </div>
      ) : isRequest && iAmRequester ? (
        <div className="shrink-0 border-t border-border bg-surface px-4 py-4 text-center text-xs text-muted">
          Waiting for {other.full_name} to accept your message request.
        </div>
      ) : (
        <MessageInput
          onSend={handleSend}
          uploadProgress={uploadProgress}
          disabled={!canSend && !showBanner}
          placeholder={`Message ${other.full_name}...`}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />
      )}
    </div>
  );
}
