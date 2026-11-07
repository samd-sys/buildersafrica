import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";
import {
  CODE_LIFETIME_MS,
  getBearerToken,
  jsonError,
  randomBase64Url,
  sha256Hex,
} from "@/lib/server/extensionAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // This route receives the user's normal Supabase access token.
  const accessToken = getBearerToken(request);
  if (!accessToken) return jsonError("unauthorized", 401);

  let body: { challenge?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_body", 400);
  }

  const challenge = body.challenge;
  if (typeof challenge !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(challenge)) {
    return jsonError("invalid_challenge", 400);
  }

  const admin = getSupabaseAdmin();

  // Ask Supabase Auth to verify the token and tell us who it belongs to.
  const { data, error } = await admin.auth.getUser(accessToken);
  if (error || !data.user) return jsonError("unauthorized", 401);

  const code = randomBase64Url(32);

  const { error: insertError } = await admin
    .from("extension_connect_codes")
    .insert({
      code_hash: sha256Hex(code), // only the hash is stored
      user_id: data.user.id,
      code_challenge: challenge,
      expires_at: new Date(Date.now() + CODE_LIFETIME_MS).toISOString(),
    });

  if (insertError) return jsonError("server_error", 500);

  return Response.json({ code });
}