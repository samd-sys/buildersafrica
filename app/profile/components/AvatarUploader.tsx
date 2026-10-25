import { useRef, useState } from "react";
import { User, Camera, Loader2 } from "lucide-react";

type AvatarUploaderProps = {
  avatarUrl: string;
  name?: string;
  onFileSelected: (file: File) => Promise<void> | void;
};

/**
 * Click the avatar -> hidden file input opens -> instant local
 * preview via a blob URL while onFileSelected (passed down from
 * page.tsx) uploads the file to storage and resolves the real URL.
 */
export default function AvatarUploader({
  avatarUrl,
  name,
  onFileSelected,
}: AvatarUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);
    setIsUploading(true);

    try {
      await onFileSelected(file);
    } finally {
      setIsUploading(false);
      // Reset the input so selecting the same file again still fires onChange
      e.target.value = "";
    }
  };

  const displayUrl = localPreview || avatarUrl;

  return (
    <div
      onClick={() => fileInputRef.current?.click()}
      className="relative w-24 h-24 rounded-full bg-[#18181B] border-2 border-[#27272A] flex items-center justify-center group overflow-hidden cursor-pointer shadow-xl"
      title="Click to change photo"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
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
  );
}