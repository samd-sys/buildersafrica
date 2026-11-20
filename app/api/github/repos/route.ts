import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";
import { jsonError } from "@/lib/server/extensionAuth";
import { getRequestUserId } from "@/lib/server/userAuth";
import { createGitHubApi, GitHubApiError } from "@/lib/server/githubApi";
import { newVerificationCode, parseRepoInput } from "@/lib/server/githubRepo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_REPOSITORIES_PER_PROJECT = 5;

/**
 * Adds a PUBLIC GitHub repository to a project, waiting to be verified.
 * Only the project's founder may do this.
 */
export async function POST(request: Request) {
  const userId = await getRequestUserId(request);
  if (!userId) return jsonError("unauthorized", 401);

  const syncToken = process.env.GITHUB_SYNC_TOKEN?.trim();
  if (!syncToken) return jsonError("github_sync_not_configured", 503);

  const text = await request.text();
  if (text.length > 4000) return jsonError("payload_too_large", 413);

  let body: { projectId?: unknown; repo?: unknown };
  try {
    body = JSON.parse(text);
  } catch {
    return jsonError("invalid_body", 400);
  }

  if (typeof body !== "object" || body === null) return jsonError("invalid_body", 400);
  if (typeof body.projectId !== "string" || !UUID_RE.test(body.projectId)) {
    return jsonError("invalid_project", 400);
  }
  if (typeof body.repo !== "string") return jsonError("invalid_repo", 400);

  const repoRef = parseRepoInput(body.repo);
  if (!repoRef) return jsonError("invalid_repo", 400);

  const admin = getSupabaseAdmin();
  const projectId = body.projectId.toLowerCase();

  // Only the founder of the project.
  const { data: project, error: projectError } = await admin
    .from("projects")
    .select("user_id")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError) return jsonError("server_error", 500);
  if (!project || project.user_id !== userId) return jsonError("forbidden", 403);

  const { data: existing, error: countError } = await admin
    .from("project_repositories")
    .select("id")
    .eq("project_id", projectId);

  if (countError) return jsonError("server_error", 500);
  if ((existing ?? []).length >= MAX_REPOSITORIES_PER_PROJECT) {
    return jsonError("too_many_repositories", 409);
  }

  let info;
  try {
    info = await createGitHubApi(fetch, syncToken).getRepo(repoRef.owner, repoRef.name);
  } catch (error) {
    if (error instanceof GitHubApiError && error.kind === "not-found") {
      return jsonError("repo_not_found_or_private", 404);
    }
    if (error instanceof GitHubApiError && error.kind === "rate-limit") {
      return jsonError("github_rate_limited", 503);
    }
    return jsonError("github_unavailable", 502);
  }

  if (info.isPrivate) return jsonError("repo_is_private", 422);

  const verificationCode = newVerificationCode();

  const { data: created, error: insertError } = await admin
    .from("project_repositories")
    .insert({
      project_id: projectId,
      github_repo_id: info.id,
      owner: info.owner,
      name: info.name,
      default_branch: info.defaultBranch,
      status: "pending",
      verification_code: verificationCode,
      added_by: userId,
    })
    .select("id")
    .single();

  if (insertError) {
    // 23505: this repository is already on this project.
    return jsonError(insertError.code === "23505" ? "already_linked" : "server_error", insertError.code === "23505" ? 409 : 500);
  }

  return Response.json({
    repository: {
      id: created.id,
      owner: info.owner,
      name: info.name,
      status: "pending",
      verificationCode,
    },
  });
}