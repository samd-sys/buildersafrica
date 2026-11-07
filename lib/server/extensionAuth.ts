import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { getSupabaseAdmin } from "./supabaseAdmin";

export const TOKEN_PREFIX = "baext_";
export const TOKEN_LIFETIME_DAYS = 90;
export const CODE_LIFETIME_MS = 5 * 60 * 1000;

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function sha256Base64Url(value: string): string {
  return createHash("sha256").update(value).digest("base64url");
}

export function randomBase64Url(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const [scheme, value] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !value) return null;
  return value.trim();
}

export function jsonError(error: string, status: number): Response {
  return Response.json({ error }, { status });
}

/**
 * Validates an extension token (the "baext_..." value sent by VS Code).
 * Returns the user id and token id, or null if the token is missing,
 * unknown, revoked or expired.
 */
export async function authenticateExtensionToken(
  request: Request
): Promise<{ userId: string; tokenId: string } | null> {
  const token = getBearerToken(request);
  if (!token || !token.startsWith(TOKEN_PREFIX)) return null;

  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from("extension_tokens")
    .select("id, user_id")
    .eq("token_hash", sha256Hex(token))
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error || !data) return null;

  await admin
    .from("extension_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id);

  return { userId: data.user_id as string, tokenId: data.id as string };
}