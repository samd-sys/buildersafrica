import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";
import { jsonError } from "@/lib/server/extensionAuth";
import { getRequestUserId } from "@/lib/server/userAuth";
import { createGitHubApi, GitHubApiError } from "@/lib/server/githubApi";
import { SYNC_COOLDOWN_MS, collectRepositoryActivity } from "@/lib/server/githubSync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UNAVAILABLE_NOTE =
  "The repository is no longer available (it may be private, deleted or transferred).";

/** Refreshes the last 30 days of GitHub activity for one verified repository. */
export async function POST(request: Request) {
  const userId = await getRequestUserId(request);
  if (!userId) return jsonError("unauthorized", 401);

  const syncToken = process.env.GITHUB_SYNC_TOKEN?.trim();
  if (!syncToken) return jsonError("github_sync_not_configured", 503);

  let body: { repositoryId?: unknown };
  try {
    body = JSON.parse(await request.text());
  } catch {
    return jsonError("invalid_body", 400);
  }

  if (typeof body !== "object" || body === null || typeof body.repositoryId !== "string" || !UUID_RE.test(body.repositoryId)) {
    return jsonError("invalid_repository", 400);
  }

  const admin = getSupabaseAdmin();

  const { data: repo, error } = await admin
    .from("project_repositories")
    .select("id, project_id, github_repo_id, owner, name, status, last_synced_at")
    .eq("id", body.repositoryId.toLowerCase())
    .maybeSingle();

  if (error) return jsonError("server_error", 500);
  if (!repo) return jsonError("not_found", 404);

  const { data: project } = await admin
    .from("projects")
    .select("user_id")
    .eq("id", repo.project_id)
    .maybeSingle();

  if (!project || project.user_id !== userId) return jsonError("forbidden", 403);
  if (repo.status !== "verified") return jsonError("not_verified", 409);

  const nowMs = Date.now();

  if (repo.last_synced_at) {
    const waitMs = SYNC_COOLDOWN_MS - (nowMs - new Date(repo.last_synced_at as string).getTime());
    if (waitMs > 0) {
      return Response.json(
        { error: "too_soon", retryAfterSeconds: Math.ceil(waitMs / 1000) },
        { status: 429 }
      );
    }
  }

  let outcome;
  try {
    outcome = await collectRepositoryActivity(
      createGitHubApi(fetch, syncToken),
      { owner: repo.owner as string, name: repo.name as string, githubRepoId: Number(repo.github_repo_id) },
      nowMs
    );
  } catch (caught) {
    if (caught instanceof GitHubApiError && caught.kind === "not-found") {
      await admin
        .from("project_repositories")
        .update({ status: "unavailable", last_sync_note: UNAVAILABLE_NOTE })
        .eq("id", repo.id);
      return jsonError("repo_unavailable", 409);
    }
    if (caught instanceof GitHubApiError && caught.kind === "rate-limit") {
      return jsonError("github_rate_limited", 503);
    }
    return jsonError("github_unavailable", 502);
  }

  // One atomic database call replaces the whole window and records the sync.
  const { error: rpcError } = await admin.rpc("replace_github_activity", {
    p_repo_id: repo.id,
    p_since: outcome.since,
    p_rows: outcome.rows,
    p_owner: outcome.repo.owner,
    p_name: outcome.repo.name,
    p_default_branch: outcome.repo.defaultBranch,
    p_note: outcome.note,
  });

  if (rpcError) {
    console.error("github activity replace failed", rpcError.code);
    return jsonError("server_error", 500);
  }

  return Response.json({
    since: outcome.since,
    note: outcome.note,
    totals: {
      commits: outcome.rows.reduce((sum, r) => sum + r.commits, 0),
      prsOpened: outcome.rows.reduce((sum, r) => sum + r.prs_opened, 0),
      prsMerged: outcome.rows.reduce((sum, r) => sum + r.prs_merged, 0),
    },
  });
}