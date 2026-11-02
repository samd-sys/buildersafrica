"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ReactCrop, { type PercentCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Loader2 } from "lucide-react";
import { canvasToFile, renderCrop } from "./cropImage";
import {
  defaultFreeCrop,
  fitAspectCrop,
  fitWithin,
  percentToNaturalCrop,
} from "./freeCrop";

const ASPECTS: { label: string; value: number | undefined }[] = [
  { label: "Free", value: undefined },
  { label: "1:1", value: 1 },
  { label: "16:9", value: 16 / 9 },
];

type Props = {
  /** The picked file. The modal is open whenever this is not null. */
  file: File | null;
  title?: string;
  fileName?: string;
  /** Longest side of the exported PNG in px. Smaller crops are not scaled up. */
  maxOutput?: number;
  onCancel: () => void;
  onConfirm: (cropped: File) => Promise<void> | void;
};

/**
 * Free-form crop: a box with drag handles on all four edges and corners.
 * Exports a PNG so transparent logos stay transparent.
 */
export default function FreeCropModal({
  file,
  title = "Crop your image",
  fileName = "image.png",
  maxOutput = 512,
  onCancel,
  onConfirm,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<PercentCrop>();
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Object URL for the picked file; everything resets for each new file
  useEffect(() => {
    if (!file) {
      setSrc(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setSrc(url);
    setCrop(undefined);
    setAspect(undefined);
    setNatural(null);
    setError(null);
    setBusy(false);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Escape closes the modal (unless a save is in progress)
  useEffect(() => {
    if (!file) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [file, busy, onCancel]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const w = e.currentTarget.naturalWidth;
    const h = e.currentTarget.naturalHeight;
    setNatural({ w, h });
    setCrop(aspect ? fitAspectCrop(aspect, w, h) : defaultFreeCrop(w, h));
  };

  const handleAspect = (value: number | undefined) => {
    setAspect(value);
    // Locking a ratio snaps the box to it; going back to Free keeps the box as is
    if (value && natural) setCrop(fitAspectCrop(value, natural.w, natural.h));
  };

  // Size of the file that will be produced, shown under the image
  const result =
    crop && natural
      ? (() => {
          const n = percentToNaturalCrop(crop, natural.w, natural.h);
          return fitWithin(n.width, n.height, maxOutput);
        })()
      : null;

  const canSave = !!crop && crop.width > 0 && crop.height > 0 && !!natural && !busy;

  const handleSave = async () => {
    if (!src || !crop || !natural || busy) return;
    setBusy(true);
    setError(null);
    try {
      const area = percentToNaturalCrop(crop, natural.w, natural.h);
      const out = fitWithin(area.width, area.height, maxOutput);
      const canvas = await renderCrop(src, area, 0, out.width, out.height, "png");
      const cropped = await canvasToFile(canvas, fileName, "png");
      await onConfirm(cropped);
    } catch {
      setError("Couldn't process this image. Please try a different one.");
    } finally {
      setBusy(false);
    }
  };

  if (!mounted || !file) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="free-crop-title"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#1F1F23] bg-[#0F0F11] shadow-2xl">
        <div className="border-b border-[#1F1F23] px-5 py-4">
          <h2 id="free-crop-title" className="text-sm font-bold text-white">
            {title}
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Drag the handles on the edges or corners to crop. Drag inside the box to move it.
          </p>
        </div>

        <div className="flex max-h-[55vh] items-center justify-center overflow-hidden bg-black p-3">
          {src && (
            <ReactCrop
              crop={crop}
              onChange={(_pixels, percent) => setCrop(percent)}
              aspect={aspect}
              minWidth={24}
              minHeight={24}
              keepSelection
              ruleOfThirds
            >
              <img
                src={src}
                alt="Image to crop"
                onLoad={handleImageLoad}
                style={{ maxHeight: "50vh", maxWidth: "100%" }}
              />
            </ReactCrop>
          )}
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5" role="group" aria-label="Crop shape">
              {ASPECTS.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  onClick={() => handleAspect(a.value)}
                  aria-pressed={aspect === a.value}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    aspect === a.value
                      ? "border-[#00AFEF]/40 bg-[#00AFEF]/10 text-[#00AFEF]"
                      : "border-[#1F1F23] bg-[#121215] text-gray-400 hover:text-white"
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
            {result && (
              <span className="text-xs text-gray-500">
                {result.width} × {result.height} px
              </span>
            )}
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="rounded-xl border border-[#1F1F23] px-4 py-2 text-sm text-gray-400 transition-colors hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className="flex items-center gap-2 rounded-xl bg-[#00AFEF] px-5 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-[#00AFEF]/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy && <Loader2 size={14} className="animate-spin" />}
              {busy ? "Saving..." : "Crop & save"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}