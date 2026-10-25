import { useRef, useState, useCallback } from "react";
import { Paperclip, Send, X, Loader2 } from "lucide-react";
import {
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
  formatFileSize,
} from "../types";
import UploadProgress from "./UploadProgress";
import MentionPicker, { TeamMemberOption } from "../group-chat/components/MentionPicker";
import ReplyPreview from "../group-chat/components/ReplyPreview";

export type ReplyTo = {
  id: string;
  senderName: string;
  content: string;
};

type Props = {
  onSend: (content: string, file?: File, replyTo?: ReplyTo) => Promise<void>;
  uploadProgress: number | null;
  disabled?: boolean;
  placeholder?: string;
  // Only passed for group chat
  teamMembers?: TeamMemberOption[];
  replyTo?: ReplyTo | null;
  onCancelReply?: () => void;
};

export default function MessageInput({
  onSend,
  uploadProgress,
  disabled = false,
  placeholder = "Type a message...",
  teamMembers,
  replyTo,
  onCancelReply,
}: Props) {
  const [text,      setText]      = useState("");
  const [file,      setFile]      = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [sending,   setSending]   = useState(false);

  // Mention state
  const [mentionQuery,  setMentionQuery]  = useState<string | null>(null);
  const [mentionStart,  setMentionStart]  = useState<number>(-1);

  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFileError(null);
    if (!ALLOWED_FILE_TYPES.includes(selected.type)) {
      setFileError("File type not supported. Use images, PDF, DOCX, or TXT.");
      e.target.value = "";
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      setFileError(`File too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}.`);
      e.target.value = "";
      return;
    }
    setFile(selected);
  };

  const clearFile = () => {
    setFile(null);
    setFileError(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  // Detect @ in textarea and extract the current mention query
  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val    = e.target.value;
      const cursor = e.target.selectionStart ?? val.length;
      setText(val);

      if (!teamMembers) return; // mentions only in group chat

      // Find the last @ before the cursor
      const textBeforeCursor = val.slice(0, cursor);
      const atIdx = textBeforeCursor.lastIndexOf("@");

      if (atIdx !== -1) {
        const afterAt = textBeforeCursor.slice(atIdx + 1);
        // Only show picker if no space after @
        if (!afterAt.includes(" ")) {
          setMentionQuery(afterAt);
          setMentionStart(atIdx);
          return;
        }
      }
      setMentionQuery(null);
      setMentionStart(-1);
    },
    [teamMembers]
  );

  const handleMentionSelect = (member: TeamMemberOption) => {
    // Replace @query with @FullName + space
    const before  = text.slice(0, mentionStart);
    const after   = text.slice(mentionStart + 1 + (mentionQuery?.length ?? 0));
    const newText = `${before}@${member.full_name} ${after}`;
    setText(newText);
    setMentionQuery(null);
    setMentionStart(-1);
    textRef.current?.focus();
  };

  const handleSend = async () => {
    if ((!text.trim() && !file) || sending || disabled) return;
    setSending(true);
    await onSend(text.trim(), file ?? undefined, replyTo ?? undefined);
    setText("");
    setFile(null);
    setMentionQuery(null);
    if (fileRef.current) fileRef.current.value = "";
    setSending(false);
    textRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape" && mentionQuery !== null) {
      e.preventDefault();
      setMentionQuery(null);
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="shrink-0 border-t border-[#1F1F23] bg-[#0C0C0E] px-4 py-3 space-y-2">
      {/* Upload progress */}
      {uploadProgress !== null && file && (
        <UploadProgress
          fileName={file.name}
          fileSize={file.size}
          progress={uploadProgress}
        />
      )}

      {/* Reply preview */}
      {replyTo && onCancelReply && (
        <ReplyPreview
          mode="input"
          senderName={replyTo.senderName}
          content={replyTo.content}
          onCancel={onCancelReply}
        />
      )}

      {/* File preview pill */}
      {file && uploadProgress === null && (
        <div className="flex items-center gap-2 rounded-xl border border-[#00AFEF]/20 bg-[#00AFEF]/5 px-3 py-2 max-w-xs">
          <Paperclip size={13} className="text-[#00AFEF] shrink-0" />
          <span className="text-xs text-[#00AFEF] truncate flex-1">{file.name}</span>
          <span className="text-[10px] text-gray-500 shrink-0">
            {formatFileSize(file.size)}
          </span>
          <button onClick={clearFile} className="text-gray-500 hover:text-red-400 transition-colors shrink-0">
            <X size={13} />
          </button>
        </div>
      )}

      {/* File error */}
      {fileError && <p className="text-xs text-red-400 px-1">{fileError}</p>}

      {/* Input row — relative so MentionPicker can anchor to it */}
      <div className="relative">
        {/* Mention picker */}
        {mentionQuery !== null && teamMembers && (
          <MentionPicker
            query={mentionQuery}
            members={teamMembers}
            onSelect={handleMentionSelect}
            onClose={() => setMentionQuery(null)}
          />
        )}

        <div className={`flex items-end gap-2 rounded-2xl border bg-[#121215] px-4 py-2 transition-colors focus-within:border-[#00AFEF]/40 ${
          disabled ? "border-[#1F1F23] opacity-60" : "border-[#1F1F23]"
        }`}>
          <input
            ref={fileRef}
            type="file"
            accept={ALLOWED_FILE_TYPES.join(",")}
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={disabled || !!file}
            className="mb-1.5 text-gray-500 hover:text-[#00AFEF] transition-colors disabled:opacity-40"
            title="Attach file"
          >
            <Paperclip size={18} />
          </button>

          <textarea
            ref={textRef}
            rows={1}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 resize-none bg-transparent py-1.5 text-sm text-white placeholder:text-white/25 outline-none max-h-32"
            style={{ lineHeight: "1.5" }}
          />

          <button
            type="button"
            onClick={handleSend}
            disabled={(!text.trim() && !file) || sending || disabled}
            className="mb-1 flex h-8 w-8 items-center justify-center rounded-xl bg-[#00AFEF] text-slate-950 transition-all hover:bg-[#00AFEF]/80 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            {sending ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Send size={15} />
            )}
          </button>
        </div>
      </div>

      <p className="text-[10px] text-gray-600 px-1">
        Press Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}