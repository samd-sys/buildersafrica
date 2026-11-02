import type { Area } from "react-easy-crop";

export type OutputFormat = "jpeg" | "png";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read this image."));
    img.src = src;
  });
}

/**
 * Renders the chosen crop onto a canvas of exactly outWidth x outHeight.
 *
 * `pixelCrop` comes from react-easy-crop and is measured on the image AFTER
 * rotation, so when the image is rotated we rotate a copy first and cut the
 * crop out of that. Unrotated images are drawn straight from the source, which
 * avoids a second full-size canvas (matters for 12MP phone photos).
 */
export async function renderCrop(
  src: string,
  pixelCrop: Area,
  rotation: number,
  outWidth: number,
  outHeight: number,
  format: OutputFormat = "jpeg"
): Promise<HTMLCanvasElement> {
  const image = await loadImage(src);

  let source: CanvasImageSource = image;

  if (rotation % 360 !== 0) {
    const rad = (rotation * Math.PI) / 180;
    const boxW = Math.abs(Math.cos(rad) * image.width) + Math.abs(Math.sin(rad) * image.height);
    const boxH = Math.abs(Math.sin(rad) * image.width) + Math.abs(Math.cos(rad) * image.height);

    const rotated = document.createElement("canvas");
    rotated.width = Math.round(boxW);
    rotated.height = Math.round(boxH);
    const rctx = rotated.getContext("2d");
    if (!rctx) throw new Error("Canvas is not supported in this browser.");

    rctx.translate(rotated.width / 2, rotated.height / 2);
    rctx.rotate(rad);
    rctx.drawImage(image, -image.width / 2, -image.height / 2);
    source = rotated;
  }

  const out = document.createElement("canvas");
  out.width = outWidth;
  out.height = outHeight;
  const ctx = out.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser.");

  // JPEG has no transparency, so transparent pixels become white. PNG keeps them.
  if (format === "jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, outWidth, outHeight);
  }
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    source,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outWidth,
    outHeight
  );

  return out;
}

export function canvasToFile(
  canvas: HTMLCanvasElement,
  fileName: string,
  format: OutputFormat = "jpeg"
): Promise<File> {
  const type = format === "png" ? "image/png" : "image/jpeg";
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(new File([blob], fileName, { type }))
          : reject(new Error("Could not export the image.")),
      type,
      format === "jpeg" ? 0.9 : undefined
    );
  });
}