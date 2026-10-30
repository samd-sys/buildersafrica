
"use client";

import { useState } from "react";
import { Trash2, CornerUpLeft, X } from "lucide-react";
import { GroupMessage, formatGroupTime } from "../groupTypes";
import ReplyPreview from "./ReplyPreview";

type Props = {
  message: GroupMessage;
  isMine: boolean;
  showSender: boolean;
  onDelete: (id: string) => Promise<void>;
  onReply: (msg: GroupMessage) => void;
};

// Renders message content with @mentions highlighted in #00AFEF
function MessageContent({ content }: { content: string }) {
  const parts = content.split(/(@[\w\s]+?)(?=\s|$|@)/g);

  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("@") ? (
          <span key={i} className="font-semibold text-[#00AFEF]">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export default function GroupMessageBubble({
  message: m,
  isMine,
  showSender,
  onDelete,
  onReply,
}: Props) {
  const [hovering, setHovering] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  const isDeleted = !!m.deleted_at;
  const isImage = m.attachment_type?.startsWith("image/");
  const hasReply = !!(m as any).reply_to_content;

  return (
    <div
      className={`flex items-end gap-2 ${
        isMine ? "flex-row-reverse" : "flex-row"
      }`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Avatar */}
      <div className={`w-7 shrink-0 ${isMine ? "hidden" : ""}`}>
        {showSender ? (
          <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-secondary">
            {m.senderAvatar ? (
              <img
                src={m.senderAvatar}
                alt={m.senderName}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-[9px] font-bold text-muted">
                {m.senderName?.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
        ) : null}
      </div>

      {/* Action buttons on hover */}
      {hovering && !isDeleted && (
        <div
          className={`mb-1 flex items-center gap-1 ${
            isMine ? "flex-row" : "flex-row-reverse"
          }`}
        >
          {/* Reply */}
          <button
            type="button"
            onClick={() => onReply(m)}
            title="Reply"
            aria-label="Reply to message"
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted transition-colors hover:text-[#00AFEF]"
          >
            <CornerUpLeft size={13} />
          </button>

          {/* Delete (own messages only) */}
          {isMine && (
            <button
              type="button"
              onClick={() => onDelete(m.id)}
              title="Delete"
              aria-label="Delete message"
              className="flex h-6 w-6 items-center justify-center rounded-md text-muted transition-colors hover:text-red-500"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      )}

      <div
        className={`flex max-w-[70%] flex-col gap-1 ${
          isMine ? "items-end" : "items-start"
        }`}
      >
        {/* Sender name */}
        {!isMine && showSender && (
          <p className="px-1 text-[11px] font-semibold text-[#00AFEF]">
            {m.senderName}
          </p>
        )}

        {/* Reply quote */}
        {hasReply && !isDeleted && (
          <ReplyPreview
            mode="bubble"
            senderName={(m as any).reply_to_sender || "Unknown"}
            content={(m as any).reply_to_content || ""}
            isMine={isMine}
          />
        )}

        {/* Bubble */}
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isDeleted
              ? "border border-border bg-transparent text-muted italic text-xs"
              : isMine
              ? "bg-[#00AFEF] text-slate-950"
              : "bg-surface-secondary text-foreground"
          } ${isMine ? "rounded-br-sm" : "rounded-bl-sm"}`}
        >
          {isDeleted ? (
            "This message was deleted"
          ) : (
            <>
              {m.content && (
                <p>
                  <MessageContent content={m.content} />
                </p>
              )}

              {m.attachment_url &&
                (isImage ? (
                  <>
                    <img
                      src={m.attachment_url}
                      alt="attachment"
                      className="mt-1 max-w-[220px] cursor-pointer rounded-xl object-cover transition-opacity hover:opacity-90"
                      onClick={() => setLightbox(true)}
                    />

                    {lightbox && (
                      <div
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
                        onClick={() => setLightbox(false)}
                      >
                        <img
                          src={m.attachment_url!}
                          alt="attachment"
                          className="max-h-full max-w-full rounded-xl object-contain"
                          onClick={(e) => e.stopPropagation()}
                        />

                        <button
                          type="button"
                          onClick={() => setLightbox(false)}
                          aria-label="Close image preview"
                          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <a
                    href={m.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 flex items-center gap-2 text-xs underline opacity-80"
                  >
                    📎 Download attachment
                  </a>
                ))}
            </>
          )}
        </div>

        {/* Timestamp */}
        <span className="px-1 text-[10px] text-muted">
          {formatGroupTime(m.created_at)}
        </span>
      </div>
    </div>
  );
}
