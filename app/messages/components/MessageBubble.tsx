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
  const hasReply  = !!m.reply_to_content;

  return (
    <div
      className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Action buttons on hover */}
      {hovering && !isDeleted && (
        <div className={`flex items-center gap-1 mb-1 ${isMine ? "flex-row" : "flex-row-reverse"}`}>
          <button
            onClick={() => onReply(m)}
            className="flex h-6 w-6 items-center justify-center rounded-md text-gray-600 hover:text-[#00AFEF] transition-colors"
            title="Reply"
          >
            <CornerUpLeft size={13} />
          </button>
          {isMine && (
            <button
              onClick={() => onDelete(m.id)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-gray-600 hover:text-red-400 transition-colors"
              title="Delete"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      )}

      <div className={`flex flex-col gap-1 max-w-[70%] ${isMine ? "items-end" : "items-start"}`}>
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
              ? "border border-[#1F1F23] bg-transparent text-gray-600 italic text-xs"
              : isMine
              ? "bg-[#00AFEF] text-slate-950"
              : "bg-[#1F1F23] text-white"
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
        <div className={`flex items-center gap-1 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
          <span className="text-[10px] text-gray-600">
            {formatMessageTime(m.created_at)}
          </span>
          {isMine && !isDeleted && (
            <span className="text-[10px]">
              {m.is_read ? (
                <CheckCheck size={12} className="text-[#00AFEF]" />
              ) : (
                <Check size={12} className="text-gray-600" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}