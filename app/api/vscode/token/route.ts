import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";
import {
  TOKEN_LIFETIME_DAYS,
  TOKEN_PREFIX,
  jsonError,
  randomBase64Url,
  safeEqual,
  sha256Base64Url,
  sha256Hex,
} from "@/lib/server/extensionAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { code?: unknown; verifier?: unknown; deviceLabel?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_body", 400);
  }

  const { code, verifier, deviceLabel } = body;

  if (typeof code !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(code)) {
    return jsonError("invalid_code", 400);
  }
  if (typeof verifier !== "string" || !/^[A-Za-z0-9_-]{43,128}$/.test(verifier)) {
    return jsonError("invalid_verifier", 400);
  }
  const label =
    typeof deviceLabel === "string" ? deviceLabel.slice(0, 80) : null;

  const admin = getSupabaseAdmin();
  const nowIso = new Date().toISOString();

  // Atomically mark the code as used. Only one request can ever succeed,
  // and the code is burned even if the verifier below turns out to be wrong.
  const { data: row } = await admin
    .from("extension_connect_codes")
    .update({ used_at: nowIso })
    .eq("code_hash", sha256Hex(code))
    .is("used_at", null)
    .gt("expires_at", nowIso)
    .select("user_id, code_challenge")
    .maybeSingle();

  if (!row) return jsonError("invalid_or_expired_code", 400);

  // PKCE check: the verifier must hash to the challenge sent at the start.
  if (!safeEqual(sha256Base64Url(verifier), row.code_challenge as string)) {
    return jsonError("invalid_or_expired_code", 400);
  }

  const token = TOKEN_PREFIX + randomBase64Url(32);
  const expiresAt = new Date(
    Date.now() + TOKEN_LIFETIME_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const { error: insertError } = await admin.from("extension_tokens").insert({
    user_id: row.user_id,
    token_hash: sha256Hex(token), // only the hash is stored
    device_label: label,
    expires_at: expiresAt,
  });

  if (insertError) return jsonError("server_error", 500);

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("user_id", row.user_id)
    .maybeSingle();

  return Response.json({
    token,
    expiresAt,
    user: { id: row.user_id, name: profile?.full_name ?? null },
  });
}