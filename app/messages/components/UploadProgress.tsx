import { Loader2 } from "lucide-react";
import { formatFileSize } from "../types";

type Props = {
  fileName: string;
  fileSize: number;
  progress: number; // 0-100
};

export default function UploadProgress({ fileName, fileSize, progress }: Props) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#1F1F23] bg-[#121215] px-4 py-3 max-w-[280px]">
      <Loader2 size={16} className="animate-spin text-[#00AFEF] shrink-0" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <p className="text-xs font-medium text-white truncate">{fileName}</p>
        <div className="space-y-1">
          <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#00AFEF] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-gray-500">{formatFileSize(fileSize)}</p>
            <p className="text-[10px] text-[#00AFEF] font-medium">{progress}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}