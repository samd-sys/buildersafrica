import { centerCrop, makeAspectCrop, type PercentCrop } from "react-image-crop";

export type Rect = { x: number; y: number; width: number; height: number };

/** A centred box covering 90% of the image, for free-form cropping. */
export function defaultFreeCrop(naturalW: number, naturalH: number): PercentCrop {
  return centerCrop({ unit: "%", width: 90, height: 90 }, naturalW, naturalH);
}

/**
 * The largest centred box (up to 90% of the image) with the given aspect ratio.
 * makeAspectCrop alone can overflow on tall/wide images, so fall back to
 * fitting by height when the width-first box would be too tall.
 */
export function fitAspectCrop(aspect: number, naturalW: number, naturalH: number): PercentCrop {
  let box = makeAspectCrop({ unit: "%", width: 90 }, aspect, naturalW, naturalH);
  if (box.height > 90) {
    box = makeAspectCrop({ unit: "%", height: 90 }, aspect, naturalW, naturalH);
  }
  return centerCrop(box, naturalW, naturalH);
}

/** Converts a percentage crop to a pixel rectangle on the full-size image. */
export function percentToNaturalCrop(crop: Rect, naturalW: number, naturalH: number): Rect {
  const x = Math.max(0, Math.round((crop.x / 100) * naturalW));
  const y = Math.max(0, Math.round((crop.y / 100) * naturalH));
  const width = Math.max(1, Math.min(naturalW - x, Math.round((crop.width / 100) * naturalW)));
  const height = Math.max(1, Math.min(naturalH - y, Math.round((crop.height / 100) * naturalH)));
  return { x, y, width, height };
}

/** Scales a size down so its long edge is at most `max`. Never scales up. */
export function fitWithin(width: number, height: number, max: number): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}