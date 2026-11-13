import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";
import { getBearerToken, jsonError } from "@/lib/server/extensionAuth";
import {
  STATE_LIFETIME_MS,
  buildAuthorizeUrl,
  buildNonceCookie,
  newNonce,
  readGitHubConfig,
  signState,
} from "@/lib/server/githubOAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Starts linking a GitHub account. Called by the signed-in user's browser.
 * Returns the GitHub address to send them to, and sets a short-lived cookie
 * that the callback uses to confirm it is the same browser.
 */
export async function POST(request: Request) {
  const config = readGitHubConfig();
  if (!config) return jsonError("github_not_configured", 503);

  const accessToken = getBearerToken(request);
  if (!accessToken) return jsonError("unauthorized", 401);

  const { data, error } = await getSupabaseAdmin().auth.getUser(accessToken);
  if (error || !data.user) return jsonError("unauthorized", 401);

  const origin = new URL(request.url).origin;
  const nonce = newNonce();

  const state = signState(
    { uid: data.user.id, nonce, exp: Date.now() + STATE_LIFETIME_MS, purpose: "link-account" },
    config.stateSecret
  );

  const url = buildAuthorizeUrl({
    clientId: config.clientId,
    redirectUri: `${origin}/api/github/callback`,
    state,
  });

  const secure = process.env.NODE_ENV === "production";

  return new Response(JSON.stringify({ url }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Set-Cookie": buildNonceCookie(nonce, secure),
    },
  });
}