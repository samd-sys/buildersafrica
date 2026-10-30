
"use client";

import { useRef, useState } from "react";
import { User, Camera, Loader2 } from "lucide-react";

type AvatarUploaderProps = {
  avatarUrl: string;
  name?: string;
  onFileSelected: (file: File) => Promise<void> | void;
};

/**
 * Click the avatar -> hidden file input opens -> instant local
 * preview via a blob URL while onFileSelected uploads the file.
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

      // Reset the input so selecting the same file again still fires onChange.
      e.target.value = "";
    }
  };

  const displayUrl = localPreview || avatarUrl;

  return (
    <button
      type="button"
      onClick={() => fileInputRef.current?.click()}
      className="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-surface-secondary shadow-xl"
      title="Click to change photo"
      aria-label="Change profile photo"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
        aria-label="Choose profile photo"
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
          className="text-muted transition-transform group-hover:scale-105"
        />
      )}

      <div
        className={`absolute inset-0 flex items-center justify-center bg-black/60 transition-all duration-200 ${
          isUploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        {isUploading ? (
          <Loader2 size={18} className="animate-spin text-white" />
        ) : (
          <Camera size={18} className="text-white" />
        )}
      </div>
    </button>
  );
}
