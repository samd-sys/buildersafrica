"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { loadProjectActivity } from "@/lib/activity/loaders";
import { toDateKey } from "@/lib/activity/dates";
import ProjectActivityView, {
  type ProjectActivityState,
} from "@/components/activity/ProjectActivityView";

export default function ProjectActivityPage() {
  const params = useParams<{ id: string }>();
  const projectId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [state, setState] = useState<ProjectActivityState>({ status: "loading" });

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
      const result = await loadProjectActivity(supabase, user.id, projectId, todayKey);

      if (result.kind === "not-found") {
        setState({ status: "not-found" });
      } else if (result.kind === "no-access") {
        setState({ status: "no-access" });
      } else {
        setState({ status: "ready", data: result.data, todayKey });
      }
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Something went wrong.",
      });
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  return <ProjectActivityView state={state} projectId={projectId} onRetry={() => void load()} />;
}