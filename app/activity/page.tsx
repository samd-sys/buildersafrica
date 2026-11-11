"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { loadMyActivity } from "@/lib/activity/loaders";
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

      const todayKey = toDateKey(new Date());
      const data = await loadMyActivity(supabase, user.id, todayKey);
      setState({ status: "ready", data, todayKey });
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