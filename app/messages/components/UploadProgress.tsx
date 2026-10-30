
import { Loader2 } from "lucide-react";
import { formatFileSize } from "../types";

type Props = {
  fileName: string;
  fileSize: number;
  progress: number; // 0-100
};

export default function UploadProgress({
  fileName,
  fileSize,
  progress,
}: Props) {
  return (
    <div className="flex max-w-[280px] items-center gap-3 rounded-xl border border-border bg-surface-secondary px-4 py-3">
      <Loader2
        size={16}
        className="shrink-0 animate-spin text-[#00AFEF]"
      />

      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="truncate text-xs font-medium text-foreground">
          {fileName}
        </p>

        <div className="space-y-1">
          <div className="h-1 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-[#00AFEF] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted">
              {formatFileSize(fileSize)}
            </p>

            <p className="text-[10px] font-medium text-[#00AFEF]">
              {progress}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
