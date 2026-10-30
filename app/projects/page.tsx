
"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Project, ActiveFilters, EMPTY_FILTERS } from "./types";
import SearchBar from "./components/SearchBar";
import FilterBar from "./components/FilterBar";
import ProjectCard from "./components/ProjectCard";
import ProjectDrawer from "./components/ProjectDrawer";
import { FolderOpen, Loader2 } from "lucide-react";
import Link from "next/link";
import { useProjectEngagement } from "./lib/useProjectEngagement";

function normArray(val: unknown): string[] {
  if (!val) return [];

  if (Array.isArray(val)) return val as string[];

  if (typeof val === "string") {
    const trimmed = val.trim();

    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
      } catch {
        // Fall through to comma-separated parsing.
      }
    }

    return trimmed.split(",").map((s) => s.trim()).filter(Boolean);
  }

  return [];
}

export default function ProjectsPage() {
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<ActiveFilters>(EMPTY_FILTERS);
  const [activeSort, setActiveSort] = useState("newest");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");

  const { toggle } = useProjectEngagement(
    allProjects,
    setAllProjects,
    currentUserId
  );

  useEffect(() => {
    const handleSidebarHover = (event: Event) => {
      const customEvent = event as CustomEvent;
      setIsSidebarHovered(customEvent.detail.isHovered);
    };

    window.addEventListener("sidebarHover", handleSidebarHover);

    return () => {
      window.removeEventListener("sidebarHover", handleSidebarHover);
    };
  }, []);

  const loadProjects = async () => {
    setLoading(true);

    const { data: projectsData, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    if (!projectsData || projectsData.length === 0) {
      setAllProjects([]);
      setLoading(false);
      return;
    }

    const userIds = [
      ...new Set(projectsData.map((p: any) => p.user_id)),
    ];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url")
      .in("user_id", userIds);

    const profileMap: Record<string, { name: string; avatar: string }> = {};

    profiles?.forEach(
      (p: { user_id: string; full_name: string; avatar_url: string }) => {
        profileMap[p.user_id] = {
          name: p.full_name || "Unknown Founder",
          avatar: p.avatar_url || "",
        };
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    setCurrentUserId(user?.id ?? "");

    const projectIds = projectsData.map((p: any) => p.id);

    const mine = async (table: string): Promise<Set<string>> => {
      if (!user) return new Set();

      const { data } = await supabase
        .from(table)
        .select("project_id")
        .eq("user_id", user.id)
        .in("project_id", projectIds);

      return new Set(
        (data ?? []).map((r: { project_id: string }) => r.project_id)
      );
    };

    const [likedSet, followedSet, savedSet] = await Promise.all([
      mine("project_likes"),
      mine("project_follows"),
      mine("project_bookmarks"),
    ]);

    const enriched: Project[] = projectsData.map((p: any) => ({
      ...p,
      tech_stack: normArray(p.tech_stack),
      team_needs: normArray(p.team_needs),
      target_audience: normArray(p.target_audience),
      founderName: profileMap[p.user_id]?.name ?? "Unknown Founder",
      founderAvatar: profileMap[p.user_id]?.avatar ?? "",
      likes: p.likes_count ?? 0,
      followers: p.followers_count ?? 0,
      isLiked: likedSet.has(p.id),
      isFollowing: followedSet.has(p.id),
      isBookmarked: savedSet.has(p.id),
    }));

    setAllProjects(enriched);
    setLoading(false);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const displayed = useMemo(() => {
    let result = [...allProjects];

    if (filters.category) {
      result = result.filter((p) => p.category === filters.category);
    }

    if (filters.location.trim()) {
      const loc = filters.location.toLowerCase();

      result = result.filter((p) =>
        p.location?.toLowerCase().includes(loc)
      );
    }

    if (filters.openPosition) {
      result = result.filter((p) =>
        p.team_needs?.includes(filters.openPosition)
      );
    }

    if (filters.stage) {
      result = result.filter((p) => p.stage === filters.stage);
    }

    if (search.trim()) {
      const q = search.toLowerCase();

      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.tech_stack?.some((t) => t.toLowerCase().includes(q)) ||
          p.founderName?.toLowerCase().includes(q)
      );
    }

    if (activeSort === "updated") {
      result.sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      );
    }

    if (activeSort === "liked") {
      result.sort((a, b) => b.likes - a.likes);
    }

    return result;
  }, [allProjects, filters, search, activeSort]);

  const hasActiveFilters = Object.values(filters).some(Boolean);

  const openProject = selectedProject
    ? allProjects.find((p) => p.id === selectedProject.id) ?? null
    : null;

  return (
    <main
      className={`mt-3 min-h-[calc(100dvh-1.5rem)] w-full min-w-0 max-w-full rounded-xl border border-border bg-background text-foreground sm:mt-4 sm:rounded-2xl md:mt-6 md:ml-4 md:w-[calc(100%+3rem)] md:max-w-none md:h-[calc(100dvh-1.5rem)] md:overflow-hidden ${
        isSidebarHovered ? "md:ml-6" : "md:ml-14."
      }`}
      style={{
        transition: "margin 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <div className="mx-auto w-full min-w-0 max-w-[1600px] px-3 py-5 sm:px-5 sm:py-6 md:h-full md:px-6 md:py-8">

        {/* Header and search */}
        <section className="space-y-4 sm:space-y-5">

          {/* Project header */}
          <div className="w-full min-w-0 rounded-xl border border-border bg-surface px-4 py-4 sm:rounded-2xl sm:px-6 sm:py-5 md:px-8">
            <div className="flex flex-wrap items-center justify-between gap-3">

              {/* Project count */}
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-secondary px-4 py-2 text-xs text-muted sm:text-sm">
                <span className="font-semibold text-foreground">
                  {allProjects.length}
                </span>
                <span>projects</span>
              </div>

              {/* New project */}
              <Link
                href="/new-project"
                className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-[#00AFEF]/50 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#00AFEF]/70 sm:text-sm"
              >
                <span aria-hidden="true">+</span>
                New Project
              </Link>

            </div>
          </div>

          {/* Search */}
          <div className="w-full min-w-0">
            <SearchBar
              value={search}
              onChange={setSearch}
            />
          </div>

        </section>

        {/* Filters and results */}
        <section className="mt-5 min-w-0 md:mt-6 md:h-[calc(100%-150px)] md:overflow-y-auto md:overscroll-contain md:pr-2">

          {/* Filters */}
          <div className="w-full min-w-0">
            <FilterBar
              filters={filters}
              onFiltersChange={setFilters}
              activeSort={activeSort}
              onSortChange={setActiveSort}
            />
          </div>

          {/* Results count */}
          <div className="mt-5 flex flex-wrap items-center gap-2 px-1 text-sm text-muted sm:mt-6">
            <FolderOpen size={15} className="shrink-0" />

            <span>
              {loading
                ? "Loading projects..."
                : `${displayed.length} project${
                    displayed.length !== 1 ? "s" : ""
                  } found`}
            </span>

            {hasActiveFilters && !loading && (
              <span className="text-xs text-[#00AFEF]">
                (filtered)
              </span>
            )}
          </div>

          {/* Project grid */}
          <div className="mt-4 pb-5 sm:mt-6 sm:pb-8">

            {loading ? (
              <div className="flex min-h-48 items-center justify-center">
                <Loader2
                  size={28}
                  className="animate-spin text-[#00AFEF]"
                />
              </div>
            ) : displayed.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center gap-4 px-4 py-12 text-center">
                <FolderOpen
                  size={44}
                  className="text-muted"
                />

                <h2 className="text-lg font-semibold text-foreground">
                  No projects found
                </h2>

                <p className="max-w-xs text-sm leading-6 text-muted">
                  Try adjusting your filters or search term.
                </p>

                <div className="flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setFilters(EMPTY_FILTERS);
                    }}
                    className="min-h-11 rounded-full border border-border px-4 py-2 text-sm text-muted transition-colors hover:bg-surface-secondary hover:text-foreground"
                  >
                    Clear all filters
                  </button>

                  <Link
                    href="/new-project"
                    className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#00AFEF]/30 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-[#00AFEF]/60"
                  >
                    Create Project
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3 xl:gap-6">
                {displayed.map((project) => (
                  <div key={project.id} className="min-w-0">
                    <ProjectCard
                      project={project}
                      onViewMore={setSelectedProject}
                      onToggleLike={(id) => toggle(id, "like")}
                      onToggleBookmark={(id) => toggle(id, "bookmark")}
                    />
                  </div>
                ))}
              </div>
            )}

          </div>
        </section>

        {/* Project details drawer */}
        <ProjectDrawer
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onToggleLike={(id) => toggle(id, "like")}
          onToggleFollow={(id) => toggle(id, "follow")}
          onToggleBookmark={(id) => toggle(id, "bookmark")}
        />

      </div>
    </main>
  );
}
