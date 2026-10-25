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
          className="mt-1 cursor-pointer overflow-hidden rounded-xl border border-white/10 max-w-[240px]"
          onClick={() => setLightbox(true)}
        >
          <img
            src={fileUrl}
            alt={fileName || "Image"}
            className="h-full w-full object-cover hover:opacity-90 transition-opacity"
            style={{ maxHeight: 180 }}
          />
        </div>

        {/* Lightbox */}
        {lightbox && (
          <div
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightbox(false)}
          >
            <img
              src={fileUrl}
              alt={fileName || "Image"}
              className="max-h-full max-w-full rounded-xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setLightbox(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white text-2xl"
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
      className={`mt-1 flex items-center gap-3 rounded-xl border px-4 py-3 max-w-[280px] transition-colors ${
        isMine
          ? "border-white/10 bg-white/5 hover:bg-white/10"
          : "border-[#1F1F23] bg-[#0F0F11] hover:bg-[#1F1F23]"
      }`}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#00AFEF]/10 border border-[#00AFEF]/20 shrink-0">
        <FileText size={16} className="text-[#00AFEF]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-white truncate">
          {fileName || "File"}
        </p>
        {fileSize && (
          <p className="text-[10px] text-gray-500">{formatFileSize(fileSize)}</p>
        )}
      </div>
      <Download size={14} className="text-gray-400 shrink-0" />
    </a>
  );
}