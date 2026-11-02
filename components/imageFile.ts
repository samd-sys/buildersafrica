export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const ACCEPT_IMAGE_TYPES = ALLOWED_IMAGE_TYPES.join(",");
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

/** Returns an error message, or null when the file is fine. */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Please choose a JPEG, PNG or WebP image.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "That image is larger than 10 MB. Please choose a smaller one.";
  }
  return null;
}