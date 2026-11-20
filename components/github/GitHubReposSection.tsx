"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import GitHubReposView, {
  messageForError,
  type RepoNotice,
  type RepoRow,
  type ReposState,
} from "./GitHubReposView";

async function callApi(path: string, body: unknown): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return { ok: false, data: { error: "unauthorized" } };

  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { ok: res.ok, data };
  } catch {
    return { ok: false, data: { error: "github_unavailable" } };
  }
}

/** Repository links for one project. Shown to the project's founder only. */
export default function GitHubReposSection({ projectId }: { projectId: string }) {
  const [state, setState] = useState<ReposState>({ status: "loading" });

  const load = useCallback(
    async (notice: RepoNotice | null = null) => {
      const { data, error } = await supabase
        .from("project_repositories")
        .select("id, owner, name, status, verification_code, last_synced_at, last_sync_note")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (error) {
        setState({ status: "error", message: "Could not load the linked repositories." });
        return;
      }

      const repos: RepoRow[] = (data ?? []).map((row) => ({
        id: String(row.id),
        fullName: `${row.owner}/${row.name}`,
        status: row.status === "verified" ? "verified" : row.status === "unavailable" ? "unavailable" : "pending",
        verificationCode: row.verification_code ? String(row.verification_code) : null,
        lastSyncedAt: row.last_synced_at ? String(row.last_synced_at) : null,
        lastSyncNote: row.last_sync_note ? String(row.last_sync_note) : null,
      }));

      setState({ status: "ready", repos, busyId: null, adding: false, notice });
    },
    [projectId]
  );

  useEffect(() => {
    void load();
  }, [load]);

  const patch = (changes: { busyId?: string | null; adding?: boolean }) =>
    setState((current) => (current.status === "ready" ? { ...current, ...changes } : current));

  const fail = (data: Record<string, unknown>) =>
    setState((current) =>
      current.status === "ready"
        ? {
            ...current,
            busyId: null,
            adding: false,
            notice: {
              kind: "error",
              text: messageForError(
                typeof data.error === "string" ? data.error : null,
                typeof data.retryAfterSeconds === "number" ? { retryAfterSeconds: data.retryAfterSeconds } : undefined
              ),
            },
          }
        : current
    );

  const add = async (input: string) => {
    patch({ adding: true });
    const { ok, data } = await callApi("/api/github/repos", { projectId, repo: input });
    if (!ok) return fail(data);
    await load({ kind: "info", text: "Repository added. Complete the verification step below." });
  };

  const verify = async (id: string) => {
    patch({ busyId: id });
    const { ok, data } = await callApi("/api/github/repos/verify", { repositoryId: id });
    if (!ok) return fail(data);
    await load({ kind: "success", text: "Repository verified. You can sync it now." });
  };

  const sync = async (id: string) => {
    patch({ busyId: id });
    const { ok, data } = await callApi("/api/github/repos/sync", { repositoryId: id });
    if (!ok) return fail(data);
    const totals = (data.totals ?? {}) as { commits?: number; prsOpened?: number; prsMerged?: number };
    await load({
      kind: "success",
      text: `Synced: ${totals.commits ?? 0} commits, ${totals.prsOpened ?? 0} pull requests opened and ${totals.prsMerged ?? 0} merged in the last 30 days.`,
    });
  };

  const remove = async (id: string) => {
    if (!window.confirm("Remove this repository from the project? Its stored GitHub counts are deleted.")) return;
    patch({ busyId: id });
    const { error } = await supabase.from("project_repositories").delete().eq("id", id);
    if (error) return fail({ error: "server_error" });
    await load({ kind: "success", text: "Repository removed." });
  };

  return (
    <GitHubReposView
      state={state}
      onAdd={(input) => void add(input)}
      onVerify={(id) => void verify(id)}
      onSync={(id) => void sync(id)}
      onRemove={(id) => void remove(id)}
      onRetry={() => void load()}
    />
  );
}