"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { loadMyActivity } from "@/lib/activity/loaders";
import { loadMyGithub, type MyGithubData } from "@/lib/activity/github";
import { toDateKey } from "@/lib/activity/dates";
import MyActivityView, { type MyActivityState } from "@/components/activity/MyActivityView";

export default function MyActivityPage() {
  const [state, setState] = useState<MyActivityState>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setState({ status: "signed-out" });
        return;
      }

      const now = new Date();
      const todayKey = toDateKey(now);
      // GitHub reports UTC days, so it uses the UTC date as "today".
      const todayUtc = now.toISOString().slice(0, 10);

      const data = await loadMyActivity(supabase, user.id, todayKey);

      // GitHub trouble must never hide the editor activity, so it fails on its own.
      let github: MyGithubData | null = null;
      try {
        github = await loadMyGithub(supabase, user.id, todayUtc);
      } catch {
        github = null;
      }

      setState({ status: "ready", data, todayKey, todayUtc, github });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Something went wrong.",
      });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return <MyActivityView state={state} onRetry={() => void load()} />;
}