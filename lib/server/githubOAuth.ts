import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Linking a GitHub account to a BuildersAfrica account.
 *
 * The flow is the standard OAuth web flow, used ONLY to prove who owns a
 * GitHub account. No scopes are requested, the access token is used once to
 * read the public GitHub id and username, and it is revoked straight away.
 * Nothing secret is ever stored.
 */

export const STATE_LIFETIME_MS = 10 * 60 * 1000;
export const NONCE_COOKIE = "ba_github_oauth";

const USER_AGENT = "BuildersAfrica";
const API_VERSION = "2022-11-28";
const LOGIN_RE = /^[A-Za-z0-9-]{1,39}$/;

export interface GitHubConfig {
  clientId: string;
  clientSecret: string;
  stateSecret: string;
}

/** Returns null unless everything needed is present and the signing secret is long enough. */
export function readGitHubConfig(
  env: Record<string, string | undefined> = process.env
): GitHubConfig | null {
  const clientId = env.GITHUB_CLIENT_ID?.trim();
  const clientSecret = env.GITHUB_CLIENT_SECRET?.trim();
  const stateSecret = env.GITHUB_STATE_SECRET?.trim();

  if (!clientId || !clientSecret || !stateSecret || stateSecret.length < 32) {
    return null;
  }

  return { clientId, clientSecret, stateSecret };
}

// ---------- signed state ----------

export interface StatePayload {
  /** The BuildersAfrica user who started the flow. */
  uid: string;
  nonce: string;
  exp: number;
  purpose: "link-account";
}

export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function newNonce(): string {
  return randomBytes(24).toString("base64url");
}

export function signState(payload: StatePayload, secret: string): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${signature}`;
}

/** Returns the payload only if the signature is genuine, the shape is right and it has not expired. */
export function verifyState(token: string, secret: string, nowMs: number): StatePayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [body, signature] = parts;
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  if (!safeEqual(signature, expected)) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null) return null;
  const p = parsed as Record<string, unknown>;

  if (
    typeof p.uid !== "string" ||
    p.uid.length === 0 ||
    p.uid.length > 64 ||
    typeof p.nonce !== "string" ||
    p.nonce.length < 20 ||
    p.nonce.length > 64 ||
    typeof p.exp !== "number" ||
    !Number.isFinite(p.exp) ||
    p.purpose !== "link-account"
  ) {
    return null;
  }

  if (p.exp <= nowMs) return null;

  return { uid: p.uid, nonce: p.nonce, exp: p.exp, purpose: "link-account" };
}

// ---------- cookie ----------

export function buildNonceCookie(nonce: string, secure: boolean): string {
  return [
    `${NONCE_COOKIE}=${nonce}`,
    "Path=/api/github",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${Math.floor(STATE_LIFETIME_MS / 1000)}`,
    ...(secure ? ["Secure"] : []),
  ].join("; ");
}

export function clearNonceCookie(secure: boolean): string {
  return [
    `${NONCE_COOKIE}=`,
    "Path=/api/github",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    ...(secure ? ["Secure"] : []),
  ].join("; ");
}

export function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;

  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    if (part.slice(0, index).trim() === name) {
      return part.slice(index + 1).trim();
    }
  }

  return null;
}

// ---------- GitHub calls (fetch is passed in so they can be tested) ----------

type FetchFn = typeof fetch;

export function buildAuthorizeUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
}): string {
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("state", params.state);
  url.searchParams.set("allow_signup", "false");
  // No "scope" on purpose: public profile information is all that is needed.
  return url.toString();
}

export class GitHubOAuthError extends Error {}

export async function exchangeCodeForToken(
  fetchFn: FetchFn,
  params: { clientId: string; clientSecret: string; code: string; redirectUri: string }
): Promise<string> {
  const res = await fetchFn("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json", "User-Agent": USER_AGENT },
    body: JSON.stringify({
      client_id: params.clientId,
      client_secret: params.clientSecret,
      code: params.code,
      redirect_uri: params.redirectUri,
    }),
  });

  if (!res.ok) throw new GitHubOAuthError("token exchange failed");

  const data = (await res.json()) as { access_token?: unknown; error?: unknown };

  if (typeof data.access_token !== "string" || data.access_token.length === 0) {
    throw new GitHubOAuthError("no access token returned");
  }

  return data.access_token;
}

export interface GitHubUser {
  id: number;
  login: string;
}

export async function fetchGitHubUser(fetchFn: FetchFn, token: string): Promise<GitHubUser> {
  const res = await fetchFn("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": API_VERSION,
      "User-Agent": USER_AGENT,
    },
  });

  if (!res.ok) throw new GitHubOAuthError("could not read the GitHub user");

  const data = (await res.json()) as { id?: unknown; login?: unknown };

  if (
    typeof data.id !== "number" ||
    !Number.isSafeInteger(data.id) ||
    data.id <= 0 ||
    typeof data.login !== "string" ||
    !LOGIN_RE.test(data.login)
  ) {
    throw new GitHubOAuthError("unexpected GitHub user data");
  }

  return { id: data.id, login: data.login };
}

/** Best effort: the token is not needed after reading the username, so it is cancelled. */
export async function revokeToken(
  fetchFn: FetchFn,
  params: { clientId: string; clientSecret: string; token: string }
): Promise<void> {
  try {
    const basic = Buffer.from(`${params.clientId}:${params.clientSecret}`).toString("base64");
    await fetchFn(`https://api.github.com/applications/${encodeURIComponent(params.clientId)}/token`, {
      method: "DELETE",
      headers: {
        Authorization: `Basic ${basic}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": API_VERSION,
        "User-Agent": USER_AGENT,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ access_token: params.token }),
    });
  } catch {
    // Ignored: the token expires or can be revoked by the user on GitHub.
  }
}