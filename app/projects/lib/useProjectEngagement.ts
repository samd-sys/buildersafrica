"use client";

import { useCallback, useRef, type Dispatch, type SetStateAction } from "react";
import { supabase } from "@/lib/supabase";
import type { Project } from "../types";

export type EngagementKind = "like" | "follow" | "bookmark";

const TABLES: Record<EngagementKind, string> = {
  like: "project_likes",
  follow: "project_follows",
  bookmark: "project_bookmarks",
};

const FLAGS = {
  like: "isLiked",
  follow: "isFollowing",
  bookmark: "isBookmarked",
} as const;

export function useProjectEngagement(
  projects: Project[],
  setProjects: Dispatch<SetStateAction<Project[]>>,
  userId: string
) {
  // Stops a double-click from sending two requests for the same button
  const inFlight = useRef<Set<string>>(new Set());

  const toggle = useCallback(
    async (projectId: string, kind: EngagementKind) => {
      const key = `${kind}:${projectId}`;
      if (!userId || inFlight.current.has(key)) return;

      const project = projects.find((p) => p.id === projectId);
      if (!project) return;

      const flag = FLAGS[kind];
      const wasOn = Boolean(project[flag]);
      const nextOn = !wasOn;

      const apply = (on: boolean, delta: number) =>
        setProjects((prev) =>
          prev.map((p) =>
            p.id !== projectId
              ? p
              : {
                  ...p,
                  [flag]: on,
                  likes:
                    kind === "like" ? Math.max(p.likes + delta, 0) : p.likes,
                  followers:
                    kind === "follow"
                      ? Math.max(p.followers + delta, 0)
                      : p.followers,
                }
          )
        );

      inFlight.current.add(key);
      apply(nextOn, nextOn ? 1 : -1); // update the UI immediately

      const table = TABLES[kind];
      const { error } = nextOn
        ? await supabase
            .from(table)
            .insert({ project_id: projectId, user_id: userId })
        : await supabase
            .from(table)
            .delete()
            .eq("project_id", projectId)
            .eq("user_id", userId);

      inFlight.current.delete(key);

      if (error) {
        if (nextOn && error.code === "23505") {
          // Row already exists (e.g. another tab): keep it on, undo the +1
          apply(true, -1);
        } else {
          apply(wasOn, nextOn ? -1 : 1); // roll back
        }
      }
    },
    [projects, setProjects, userId]
  );

  return { toggle };
}