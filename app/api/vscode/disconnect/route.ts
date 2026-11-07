import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";
import {
  authenticateExtensionToken,
  jsonError,
} from "@/lib/server/extensionAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await authenticateExtensionToken(request);
  if (!auth) return jsonError("unauthorized", 401);

  const { error } = await getSupabaseAdmin()
    .from("extension_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", auth.tokenId);

  if (error) return jsonError("server_error", 500);

  return Response.json({ ok: true });
}