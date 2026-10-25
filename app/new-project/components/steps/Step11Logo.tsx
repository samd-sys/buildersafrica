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
        <h2 className="text-2xl font-bold text-white">
          Add a logo for your project.
        </h2>
        <p className="text-sm text-gray-400">
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
              className="h-full w-full rounded-2xl object-cover border border-[#1F1F23]"
            />
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/60">
                <Loader2 size={20} className="animate-spin text-white" />
              </div>
            )}
            {!isUploading && (
              <button
                onClick={clear}
                className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#1F1F23] border border-white/10 text-gray-400 hover:text-red-400 transition-colors"
              >
                <X size={12} />
              </button>
            )}
          </div>
          {!isUploading && (
            <button
              onClick={() => fileRef.current?.click()}
              className="text-xs text-[#00AFEF] hover:text-[#00AFEF]/40 transition-colors"
            >
              Change logo
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-[#1F1F23] bg-[#121215] px-6 py-12 transition-colors hover:border-[#00AFEF]/40 hover:bg-purple-50/[0.03]"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-[#1F1F23] bg-[#0C0C0E]">
            <Upload size={22} className="text-gray-500" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-white">
              Click to upload a logo
            </p>
            <p className="text-xs text-gray-500">
              PNG, JPG, or SVG — max 2MB
            </p>
          </div>
        </button>
      )}

      <button
        onClick={() => onChange("")}
        className="text-xs text-gray-500 hover:text-gray-300 transition-colors block mx-auto"
      >
        Skip for now →
      </button>
    </div>
  );
}