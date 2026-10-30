
import { useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Props = {
  value: string;
  onChange: (url: string) => void;
};

export default function Step11Logo({ value, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);
    setIsUploading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("You must be logged in.");
      setIsUploading(false);
      return;
    }

    const ext = file.name.split(".").pop();
    const path = `project-logos/${user.id}-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (error) {
      alert(error.message);
      setIsUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);

    onChange(publicUrl);
    setIsUploading(false);
    e.target.value = "";
  };

  const displayUrl = localPreview || value;

  const clear = () => {
    setLocalPreview(null);
    onChange("");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-foreground">
          Add a logo for your project.
        </h2>
        <p className="text-sm text-muted">
          Optional — you can always add this later from your project settings.
        </p>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />

      {displayUrl ? (
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-28 w-28">
            <img
              src={displayUrl}
              alt="Project logo"
              className="h-full w-full rounded-2xl border border-border object-cover"
            />

            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/60">
                <Loader2 size={20} className="animate-spin text-white" />
              </div>
            )}

            {!isUploading && (
              <button
                type="button"
                onClick={clear}
                aria-label="Remove project logo"
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-surface-secondary text-muted transition-colors hover:text-red-500"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {!isUploading && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-xs text-[#00AFEF] transition-colors hover:text-[#00AFEF]/70"
            >
              Change logo
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex w-full flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-border bg-surface-secondary px-6 py-12 transition-colors hover:border-[#00AFEF]/50"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-surface">
            <Upload size={22} className="text-muted" />
          </div>

          <div className="space-y-1 text-center">
            <p className="text-sm font-medium text-foreground">
              Click to upload a logo
            </p>
            <p className="text-xs text-muted">
              PNG, JPG, or SVG — max 2MB
            </p>
          </div>
        </button>
      )}

      <button
        type="button"
        onClick={() => onChange("")}
        disabled={isUploading}
        className="mx-auto block text-xs text-muted transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        Skip for now →
      </button>
    </div>
  );
}
