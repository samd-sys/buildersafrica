
"use client";

import { useState } from "react";
import { Trash2, Check, CheckCheck, CornerUpLeft } from "lucide-react";
import { DMMessage, formatMessageTime } from "../types";
import FilePreview from "./FilePreview";
import ReplyPreview from "../group-chat/components/ReplyPreview";

type Props = {
  message: DMMessage & {
    reply_to_id?: string | null;
    reply_to_content?: string | null;
    reply_to_sender?: string | null;
  };
  isMine: boolean;
  isLastMine: boolean;
  onDelete: (id: string) => Promise<void>;
  onReply: (msg: DMMessage) => void;
};

export default function MessageBubble({
  message: m,
  isMine,
  isLastMine,
  onDelete,
  onReply,
}: Props) {
  const [hovering, setHovering] = useState(false);
  const isDeleted = !!m.deleted_at;
  const hasReply = !!m.reply_to_content;

  return (
    <div
      className={`flex items-end gap-2 ${
        isMine ? "flex-row-reverse" : "flex-row"
      }`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Action buttons on hover */}
      {hovering && !isDeleted && (
        <div
          className={`mb-1 flex items-center gap-1 ${
            isMine ? "flex-row" : "flex-row-reverse"
          }`}
        >
          <button
            type="button"
            onClick={() => onReply(m)}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted transition-colors hover:text-[#00AFEF]"
            title="Reply"
          >
            <CornerUpLeft size={13} />
          </button>

          {isMine && (
            <button
              type="button"
              onClick={() => onDelete(m.id)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-muted transition-colors hover:text-red-400"
              title="Delete"
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
        {/* Reply quote */}
        {hasReply && !isDeleted && (
          <ReplyPreview
            mode="bubble"
            senderName={m.reply_to_sender || "Unknown"}
            content={m.reply_to_content || ""}
            isMine={isMine}
          />
        )}

        {/* Bubble */}
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isDeleted
              ? "border border-border bg-transparent text-muted text-xs italic"
              : isMine
              ? "bg-[#00AFEF] text-slate-950"
              : "bg-surface-secondary text-foreground"
          } ${isMine ? "rounded-br-sm" : "rounded-bl-sm"}`}
        >
          {isDeleted ? (
            "This message was deleted"
          ) : (
            <>
              {m.content && <p>{m.content}</p>}

              {m.file_url && (
                <FilePreview
                  fileUrl={m.file_url}
                  fileType={m.file_type}
                  fileName={m.file_name}
                  fileSize={m.file_size}
                  isMine={isMine}
                />
              )}
            </>
          )}
        </div>

        {/* Time + read receipt */}
        <div
          className={`flex items-center gap-1 ${
            isMine ? "flex-row-reverse" : "flex-row"
          }`}
        >
          <span className="text-[10px] text-muted">
            {formatMessageTime(m.created_at)}
          </span>

          {isMine && !isDeleted && (
            <span className="text-[10px]">
              {m.is_read ? (
                <CheckCheck size={12} className="text-[#00AFEF]" />
              ) : (
                <Check size={12} className="text-muted" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
