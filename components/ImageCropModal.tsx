"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { Loader2, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import { canvasToFile, renderCrop, type OutputFormat } from "./cropImage";

// The file-validation helpers live in imageFile.ts so screens that don't use
// this modal (e.g. the logo cropper) don't pull in its library. Re-exported here
// so existing imports keep working.
export {
  ACCEPT_IMAGE_TYPES,
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  validateImageFile,
} from "./imageFile";

type Props = {
  /** The picked file. The modal is open whenever this is not null. */
  file: File | null;
  title?: string;
  aspect?: number;
  cropShape?: "round" | "rect";
  /** Width of the exported image in px (height follows the aspect ratio). */
  outputWidth?: number;
  /** "jpeg" for photos (smaller files); "png" keeps transparency (logos). */
  outputFormat?: OutputFormat;
  fileName?: string;
  onCancel: () => void;
  onConfirm: (cropped: File) => Promise<void> | void;
};

export default function ImageCropModal({
  file,
  title = "Adjust your photo",
  aspect = 1,
  cropShape = "round",
  outputWidth = 512,
  outputFormat = "jpeg",
  fileName = "photo.jpg",
  onCancel,
  onConfirm,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pixels, setPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Object URL for the picked file; controls reset for every new file
  useEffect(() => {
    if (!file) {
      setSrc(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setSrc(url);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setPixels(null);
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

  const handleCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setPixels(areaPixels);
  }, []);

  const handleSave = async () => {
    if (!src || !pixels || busy) return;
    setBusy(true);
    setError(null);
    try {
      const canvas = await renderCrop(
        src,
        pixels,
        rotation,
        outputWidth,
        Math.round(outputWidth / aspect),
        outputFormat
      );
      const cropped = await canvasToFile(canvas, fileName, outputFormat);
      await onConfirm(cropped);
    } catch {
      setError("Couldn't process this image. Please try a different photo.");
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
      aria-labelledby="image-crop-title"
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#1F1F23] bg-[#0F0F11] shadow-2xl">
        <div className="border-b border-[#1F1F23] px-5 py-4">
          <h2 id="image-crop-title" className="text-sm font-bold text-white">
            {title}
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Drag to reposition. Use the slider to zoom.
          </p>
        </div>

        {/* The cropper is position:absolute and fills this box, so it needs a height */}
        <div className="relative h-72 w-full bg-black sm:h-80">
          {src && (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspect}
              cropShape={cropShape}
              showGrid={cropShape === "rect"}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
            />
          )}
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <ZoomOut size={16} className="shrink-0 text-gray-500" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              aria-label="Zoom"
              className="h-1 flex-1 cursor-pointer accent-[#00AFEF]"
            />
            <ZoomIn size={16} className="shrink-0 text-gray-500" />
            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              aria-label="Rotate 90 degrees"
              className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#1F1F23] bg-[#121215] text-gray-300 transition-colors hover:text-white"
            >
              <RotateCw size={15} />
            </button>
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
              disabled={busy || !pixels}
              className="flex items-center gap-2 rounded-xl bg-[#00AFEF] px-5 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-[#00AFEF]/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy && <Loader2 size={14} className="animate-spin" />}
              {busy ? "Saving..." : "Save photo"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}