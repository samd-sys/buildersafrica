import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";
import { jsonError } from "@/lib/server/extensionAuth";
import { getRequestUserId } from "@/lib/server/userAuth";
import { createGitHubApi, GitHubApiError } from "@/lib/server/githubApi";
import { VERIFICATION_CODE_RE } from "@/lib/server/githubRepo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Checks that the founder controls the repository: the one-time code must
 * appear among the repository's public topics, and only someone with admin
 * access can add a topic.
 */
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
    .select("id, project_id, github_repo_id, owner, name, status, verification_code")
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

  if (repo.status === "verified") return Response.json({ status: "verified" });
  if (repo.status !== "pending") return jsonError("not_pending", 409);

  const code = typeof repo.verification_code === "string" ? repo.verification_code : "";
  if (!VERIFICATION_CODE_RE.test(code)) return jsonError("server_error", 500);

  const api = createGitHubApi(fetch, syncToken);

  try {
    const info = await api.getRepo(repo.owner, repo.name);
    if (info.isPrivate || info.id !== Number(repo.github_repo_id)) {
      return jsonError("repo_not_available", 422);
    }

    const topics = await api.getTopics(info.owner, info.name);
    if (!topics.includes(code)) {
      return Response.json({ error: "topic_missing", code }, { status: 422 });
    }
  } catch (caught) {
    if (caught instanceof GitHubApiError && caught.kind === "not-found") {
      return jsonError("repo_not_available", 422);
    }
    if (caught instanceof GitHubApiError && caught.kind === "rate-limit") {
      return jsonError("github_rate_limited", 503);
    }
    return jsonError("github_unavailable", 502);
  }

  const { error: updateError } = await admin
    .from("project_repositories")
    .update({ status: "verified", verified_at: new Date().toISOString(), verification_code: null })
    .eq("id", repo.id)
    .eq("status", "pending");

  if (updateError) return jsonError("server_error", 500);

  return Response.json({ status: "verified" });
}