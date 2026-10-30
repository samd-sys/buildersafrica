
"use client";

import { FileText, Download } from "lucide-react";
import { isImageType, formatFileSize } from "../types";
import { useState } from "react";

type Props = {
  fileUrl: string;
  fileType: string | null;
  fileName: string | null;
  fileSize: number | null;
  isMine: boolean;
};

export default function FilePreview({
  fileUrl,
  fileType,
  fileName,
  fileSize,
  isMine,
}: Props) {
  const [lightbox, setLightbox] = useState(false);
  const isImage = isImageType(fileType);

  if (isImage) {
    return (
      <>
        <div
          className="mt-1 max-w-[240px] cursor-pointer overflow-hidden rounded-xl border border-border"
          onClick={() => setLightbox(true)}
        >
          <img
            src={fileUrl}
            alt={fileName || "Image"}
            className="h-full w-full object-cover transition-opacity hover:opacity-90"
            style={{ maxHeight: 180 }}
          />
        </div>

        {/* Lightbox */}
        {lightbox && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
            onClick={() => setLightbox(false)}
          >
            <img
              src={fileUrl}
              alt={fileName || "Image"}
              className="max-h-full max-w-full rounded-xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              type="button"
              onClick={() => setLightbox(false)}
              aria-label="Close image preview"
              className="absolute right-4 top-4 text-2xl text-white/60 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}
      </>
    );
  }

  // Document card
  return (
    <a
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      download={fileName || true}
      className={`mt-1 flex max-w-[280px] items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
        isMine
          ? "border-border bg-surface-secondary hover:bg-surface"
          : "border-border bg-surface hover:bg-surface-secondary"
      }`}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#00AFEF]/20 bg-[#00AFEF]/10">
        <FileText size={16} className="text-[#00AFEF]" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-foreground">
          {fileName || "File"}
        </p>
        {fileSize && (
          <p className="text-[10px] text-muted">
            {formatFileSize(fileSize)}
          </p>
        )}
      </div>

      <Download size={14} className="shrink-0 text-muted" />
    </a>
  );
}
