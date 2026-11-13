"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import GitHubConnectionView, {
  noticeForOutcome,
  type GitHubConnectionState,
  type Notice,
} from "./GitHubConnectionView";

export default function GitHubConnectionCard() {
  const [state, setState] = useState<GitHubConnectionState>({ status: "loading" });

  const load = useCallback(async (initialNotice: Notice | null = null) => {
    setState({ status: "loading" });

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setState({ status: "signed-out" });
        return;
      }

      const { data, error } = await supabase
        .from("github_accounts")
        .select("github_login, linked_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        setState({ status: "error", message: "Could not load your GitHub connection." });
        return;
      }

      setState({
        status: "ready",
        account: data ? { login: String(data.github_login), linkedAt: String(data.linked_at) } : null,
        notice: initialNotice,
        busy: false,
      });
    } catch {
      setState({ status: "error", message: "Could not load your GitHub connection." });
    }
  }, []);

  useEffect(() => {
    // The server reports the result of the GitHub sign-in in the address, e.g. ?github=linked
    const params = new URLSearchParams(window.location.search);
    const notice = noticeForOutcome(params.get("github"));

    if (params.has("github")) {
      window.history.replaceState(null, "", window.location.pathname);
    }

    void load(notice);
  }, [load]);

  const setBusy = (busy: boolean, notice: Notice | null = null) =>
    setState((current) =>
      current.status === "ready" ? { ...current, busy, notice: notice ?? current.notice } : current
    );

  const connect = async () => {
    setBusy(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setState({ status: "signed-out" });
        return;
      }

      const res = await fetch("/api/github/connect", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.status === 503) {
        setBusy(false, noticeForOutcome("not-configured"));
        return;
      }

      const body = (await res.json()) as { url?: unknown };

      if (!res.ok || typeof body.url !== "string" || !body.url.startsWith("https://github.com/")) {
        setBusy(false, noticeForOutcome("failed"));
        return;
      }

      window.location.assign(body.url);
    } catch {
      setBusy(false, noticeForOutcome("failed"));
    }
  };

  const disconnect = async () => {
    if (!window.confirm("Disconnect your GitHub account from BuildersAfrica?")) return;

    setBusy(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setState({ status: "signed-out" });
      return;
    }

    const { error } = await supabase.from("github_accounts").delete().eq("user_id", user.id);

    if (error) {
      setBusy(false, { kind: "error", text: "Could not disconnect. Please try again." });
      return;
    }

    setState({
      status: "ready",
      account: null,
      notice: { kind: "success", text: "Your GitHub account was disconnected." },
      busy: false,
    });
  };

  return (
    <GitHubConnectionView
      state={state}
      onConnect={() => void connect()}
      onDisconnect={() => void disconnect()}
      onRetry={() => void load()}
    />
  );
}