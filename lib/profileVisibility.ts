// profiles.is_public is a TEXT column, so it comes back as the string "true" or
// "false". JavaScript treats the string "false" as truthy, so it must never be
// used directly as a boolean. Read it with parseIsPublic and write it with
// serializeIsPublic.

const TRUE_VALUES = new Set(["true", "t", "1", "yes", "y", "on", "public"]);

/**
 * Turns whatever is stored in profiles.is_public into a real boolean.
 * - no value yet (null/undefined) -> true, the page's existing default
 * - anything unrecognised         -> false, so a profile is never shown by mistake
 */
export function parseIsPublic(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  return TRUE_VALUES.has(String(value).trim().toLowerCase());
}

/** The exact text stored in the column. */
export function serializeIsPublic(value: boolean): "true" | "false" {
  return value ? "true" : "false";
}