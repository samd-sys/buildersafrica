import { randomBytes } from "node:crypto";

const OWNER_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;
const NAME_RE = /^[A-Za-z0-9._-]{1,100}$/;

export interface RepoRef {
  owner: string;
  name: string;
}

/**
 * Accepts "owner/name" or a github.com address and returns the owner and
 * repository name, or null for anything else. The result is only ever placed
 * into fixed api.github.com addresses, and only after these checks.
 */
export function parseRepoInput(input: string): RepoRef | null {
  let text = input.trim();
  if (text.length === 0 || text.length > 200) return null;

  let fromUrl = false;
  const urlMatch = /^https?:\/\/(?:www\.)?github\.com\/(.+)$/i.exec(text);

  if (urlMatch) {
    text = urlMatch[1];
    fromUrl = true;
  } else if (/^[a-z][a-z0-9+.-]*:/i.test(text)) {
    return null; // some other scheme or site
  }

  text = text.replace(/[?#].*$/, "").replace(/\/+$/, "");

  const parts = text.split("/");
  if (parts.length < 2 || (!fromUrl && parts.length !== 2)) return null;

  const owner = parts[0];
  const name = parts[1].replace(/\.git$/i, "");

  if (!OWNER_RE.test(owner) || !NAME_RE.test(name) || name === "." || name === "..") {
    return null;
  }

  return { owner, name };
}

/** A GitHub topic: lowercase letters, digits and hyphens, at most 50 characters. */
export function newVerificationCode(): string {
  return `ba-verify-${randomBytes(6).toString("hex")}`;
}

export const VERIFICATION_CODE_RE = /^ba-verify-[0-9a-f]{12}$/;