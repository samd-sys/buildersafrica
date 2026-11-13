import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";
import {
  NONCE_COOKIE,
  clearNonceCookie,
  exchangeCodeForToken,
  fetchGitHubUser,
  readCookie,
  readGitHubConfig,
  revokeToken,
  safeEqual,
  verifyState,
} from "@/lib/server/githubOAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Outcome = "linked" | "denied" | "invalid" | "failed" | "already-linked" | "not-configured";

/**
 * GitHub sends the browser back here after the user approves.
 * The outcome is reported on the settings page, and the only place we ever
 * redirect to is that fixed page.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const secure = process.env.NODE_ENV === "production";

  const finish = (outcome: Outcome): Response =>
    new Response(null, {
      status: 302,
      headers: {
        Location: `${url.origin}/profile/github?github=${outcome}`,
        "Set-Cookie": clearNonceCookie(secure),
        "Cache-Control": "no-store",
      },
    });

  const config = readGitHubConfig();
  if (!config) return finish("not-configured");

  if (url.searchParams.get("error")) return finish("denied");

  const code = url.searchParams.get("code");
  const stateToken = url.searchParams.get("state");
  if (!code || !stateToken) return finish("invalid");

  const state = verifyState(stateToken, config.stateSecret, Date.now());
  if (!state) return finish("invalid");

  // The same browser that started the flow must finish it.
  const cookieNonce = readCookie(request.headers.get("cookie"), NONCE_COOKIE);
  if (!cookieNonce || !safeEqual(cookieNonce, state.nonce)) return finish("invalid");

  const redirectUri = `${url.origin}/api/github/callback`;

  let token: string | null = null;
  let githubUser: { id: number; login: string };

  try {
    token = await exchangeCodeForToken(fetch, {
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      code,
      redirectUri,
    });
    githubUser = await fetchGitHubUser(fetch, token);
  } catch {
    return finish("failed");
  } finally {
    if (token) {
      await revokeToken(fetch, {
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        token,
      });
    }
  }

  const { error } = await getSupabaseAdmin()
    .from("github_accounts")
    .upsert(
      {
        user_id: state.uid,
        github_user_id: githubUser.id,
        github_login: githubUser.login,
        linked_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    // 23505: this GitHub account is already linked to a different BuildersAfrica account.
    return finish(error.code === "23505" ? "already-linked" : "failed");
  }

  return finish("linked");
}