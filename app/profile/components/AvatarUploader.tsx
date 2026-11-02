import { useCallback, useEffect, useRef, useState } from "react";
import { User, Camera, Loader2 } from "lucide-react";
import ImageCropModal, {
  ACCEPT_IMAGE_TYPES,
  validateImageFile,
} from "@/components/ImageCropModal";

type AvatarUploaderProps = {
  avatarUrl: string;
  name?: string;
  onFileSelected: (file: File) => Promise<void> | void;
};

/**
 * Click the avatar ->*/
export default function AvatarUploader({
  avatarUrl,
  name,
  onFileSelected,
}: AvatarUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pickError, setPickError] = useState<string | null>(null);

  // Release the last blob URL when the component goes away
  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so picking the same file again still fires onChange
    e.target.value = "";
    if (!file) return;

    const problem = validateImageFile(file);
    if (problem) {
      setPickError(problem);
      return;
    }
    setPickError(null);
    setPendingFile(file);
  };

  const handleCancel = useCallback(() => setPendingFile(null), []);

  const handleConfirm = async (cropped: File) => {
    setPendingFile(null);

    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const url = URL.createObjectURL(cropped);
    previewRef.current = url;
    setLocalPreview(url);

    setIsUploading(true);
    try {
      await onFileSelected(cropped);
    } finally {
      setIsUploading(false);
    }
  };

  const displayUrl = localPreview || avatarUrl;

  return (
    <div className="space-y-2">
      <div
        onClick={() => fileInputRef.current?.click()}
        className="relative w-24 h-24 rounded-full bg-[#18181B] border-2 border-[#27272A] flex items-center justify-center group overflow-hidden cursor-pointer shadow-xl"
        title="Click to change photo"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_IMAGE_TYPES}
          onChange={handlePick}
          className="hidden"
        />

        {displayUrl ? (
          <img
            src={displayUrl}
            alt={name || "Profile avatar"}
            className="h-full w-full object-cover"
          />
        ) : (
          <User
            size={32}
            className="text-gray-600 group-hover:scale-105 transition-transform"
          />
        )}

        <div
          className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-all duration-200 ${
            isUploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          {isUploading ? (
            <Loader2 size={18} className="text-white animate-spin" />
          ) : (
            <Camera size={18} className="text-white" />
          )}
        </div>
      </div>

      {pickError && (
        <p className="max-w-[220px] text-xs text-red-400">{pickError}</p>
      )}

      <ImageCropModal
        file={pendingFile}
        title="Adjust your profile photo"
        aspect={1}
        cropShape="round"
        outputWidth={512}
        fileName="avatar.jpg"
        onCancel={handleCancel}
        onConfirm={handleConfirm}
      />
    </div>
  );
}