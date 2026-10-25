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
  const [hovering,  setHovering]  = useState(false);
  const [lightbox,  setLightbox]  = useState(false);
  const isDeleted = !!m.deleted_at;
  const isImage   = m.attachment_type?.startsWith("image/");
  const hasReply  = !!(m as any).reply_to_content;

  return (
    <div
      className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Avatar */}
      <div className={`w-7 shrink-0 ${isMine ? "hidden" : ""}`}>
        {showSender ? (
          <div className="h-7 w-7 rounded-full overflow-hidden border border-[#27272A] bg-[#18181B] flex items-center justify-center">
            {m.senderAvatar ? (
              <img src={m.senderAvatar} alt={m.senderName} className="h-full w-full object-cover" />
            ) : (
              <span className="text-[9px] font-bold text-gray-500">
                {m.senderName?.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
        ) : null}
      </div>

      {/* Action buttons on hover */}
      {hovering && !isDeleted && (
        <div className={`flex items-center gap-1 mb-1 ${isMine ? "flex-row" : "flex-row-reverse"}`}>
          {/* Reply */}
          <button
            onClick={() => onReply(m)}
            className="flex h-6 w-6 items-center justify-center rounded-md text-gray-600 hover:text-[#00AFEF] transition-colors"
            title="Reply"
          >
            <CornerUpLeft size={13} />
          </button>
          {/* Delete (own messages only) */}
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
        {/* Sender name */}
        {!isMine && showSender && (
          <p className="text-[11px] font-semibold text-[#00AFEF] px-1">
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
              {m.content && <p><MessageContent content={m.content} /></p>}
              {m.attachment_url && (
                isImage ? (
                  <>
                    <img
                      src={m.attachment_url}
                      alt="attachment"
                      className="mt-1 max-w-[220px] rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setLightbox(true)}
                    />
                    {lightbox && (
                      <div
                        className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
                        onClick={() => setLightbox(false)}
                      >
                        <img
                          src={m.attachment_url!}
                          alt="attachment"
                          className="max-h-full max-w-full rounded-xl object-contain"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          onClick={() => setLightbox(false)}
                          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
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
                )
              )}
            </>
          )}
        </div>

        {/* Timestamp */}
        <span className="text-[10px] text-gray-600 px-1">
          {formatGroupTime(m.created_at || m.created_at)}
        </span>
      </div>
    </div>
  );
}