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
        // fall through to comma-split
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

  useEffect(() => {
    const handleSidebarHover = (event: CustomEvent) => {
      setIsSidebarHovered(event.detail.isHovered);
    };
    window.addEventListener("sidebarHover", handleSidebarHover as EventListener);
    return () =>
      window.removeEventListener("sidebarHover", handleSidebarHover as EventListener);
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

    const userIds = [...new Set(projectsData.map((p: any) => p.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url")
      .in("user_id", userIds);

    const profileMap: Record<string, { name: string; avatar: string }> = {};
    profiles?.forEach((p: { user_id: string; full_name: string; avatar_url: string }) => {
      profileMap[p.user_id] = {
        name: p.full_name || "Unknown Founder",
        avatar: p.avatar_url || "",
      };
    });

    const enriched: Project[] = projectsData.map((p: any) => ({
      ...p,
      tech_stack: normArray(p.tech_stack),
      team_needs: normArray(p.team_needs),
      target_audience: normArray(p.target_audience),
      founderName: profileMap[p.user_id]?.name ?? "Unknown Founder",
      founderAvatar: profileMap[p.user_id]?.avatar ?? "",
      likes: 0,
      followers: 0,
      rating: 0,
    }));

    setAllProjects(enriched);
    setLoading(false);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const displayed = useMemo(() => {
    let result = [...allProjects];

    // Category filter
    if (filters.category) {
      result = result.filter((p) => p.category === filters.category);
    }

    // Location filter — case-insensitive partial match
    if (filters.location.trim()) {
      const loc = filters.location.toLowerCase();
      result = result.filter((p) =>
        p.location?.toLowerCase().includes(loc)
      );
    }

    // Open position filter — check team_needs array
    if (filters.openPosition) {
      result = result.filter((p) =>
        p.team_needs?.includes(filters.openPosition)
      );
    }

    // Stage filter
    if (filters.stage) {
      result = result.filter((p) => p.stage === filters.stage);
    }

    // Search — name, description, category, tech, founder
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

    // Sort
    if (activeSort === "updated") {
      result.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    return result;
  }, [allProjects, filters, search, activeSort]);

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
  <div
    className={`w-300 h-160 overflow-hidden rounded-2xl border border-white/30 mt-6 bg-[#09090B] text-white transition-all duration-500 ease-in-out ${
      isSidebarHovered ? "md:ml-1" : "md:-ml-14"
    }`}
    style={{
      transform: isSidebarHovered ? "scale(1.005)" : "scale(1)",
      filter: isSidebarHovered ? "brightness(0.98)" : "brightness(1)",
      transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    }}
  >
    <div className="mx-auto max-w-8xl px-4 -mt-10 py-10">

      {/* =====================================
          STATIC SECTION
          HEADER + SEARCH
          ===================================== */}

      <div className="space-y-6">

        {/* Hero / Header */}
        <div className="w-299.5 rounded-2xl border border-white/30 bg-[#0F0F11] px-4 -ml-4 md:px-8 py-5">
          <div className="flex items-center gap-230 pt-2">

            {/* Project Count */}
            <div className="rounded-full border border-white/10 bg-white/[0.03] -mt-2 px-6 py-1.5 text-xs text-gray-400">
              <span className="text-white font-semibold">
                {allProjects.length}
              </span>{" "}
              projects
            </div>

            {/* New Project */}
            <Link
              href="/new-project"
              className="flex items-center gap-2 rounded-full bg-[#00AFEF]/50 px-4 py-2 -mt-2 text-xs font-semibold text-white transition-all hover:bg-[#00AFEF]/30"
            >
              + New Project
            </Link>

          </div>
        </div>

        {/* Search Bar */}
        <SearchBar
          value={search}
          onChange={setSearch}
        />

      </div>


      {/* =====================================
          SCROLLABLE SECTION
          FILTERS + RESULTS + PROJECTS
          ===================================== */}

      <div className="h-[calc(100vh-250px)] overflow-y-auto pr-3 mt-6">

        {/* Filter Bar */}
        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
          activeSort={activeSort}
          onSortChange={setActiveSort}
        />


        {/* Results Count */}
        <div className="flex items-center gap-2 text-sm text-gray-500 px-1 mt-6">

          <FolderOpen size={14} />

          {loading
            ? "Loading projects..."
            : `${displayed.length} project${
                displayed.length !== 1 ? "s" : ""
              } found`}

          {hasActiveFilters && !loading && (
            <span className="text-xs text-[#00AFEF] ml-1">
              (filtered)
            </span>
          )}

        </div>


        {/* =====================================
            PROJECT GRID
            ===================================== */}

        <div className="mt-6">

          {loading ? (

            /* Loading State */
            <div className="flex items-center justify-center py-24">
              <Loader2
                size={28}
                className="animate-spin text-purple-500"
              />
            </div>

          ) : displayed.length === 0 ? (

            /* Empty State */
            <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">

              <FolderOpen
                size={48}
                className="text-gray-700"
              />

              <p className="text-lg font-semibold text-white">
                No projects found
              </p>

              <p className="text-sm text-gray-500 max-w-xs">
                Try adjusting your filters or search term.
              </p>

              <div className="flex items-center gap-3 mt-2">

                {/* Clear Filters */}
                <button
                  onClick={() => {
                    setSearch("");
                    setFilters(EMPTY_FILTERS);
                  }}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm text-gray-400 hover:text-white hover:border-white/20 transition-colors"
                >
                  Clear all filters
                </button>

                {/* Create Project */}
                <Link
                  href="/new-project"
                  className="rounded-full bg-[#00AFEF]/30 px-4 py-2 text-sm font-semibold text-white hover:bg-[#00AFEF]/80 transition-colors"
                >
                  Create Project
                </Link>

              </div>

            </div>

          ) : (

            /* Projects */
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">

              {displayed.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onViewMore={setSelectedProject}
                />
              ))}

            </div>

          )}

        </div>

      </div>


      {/* =====================================
          PROJECT DRAWER
          ===================================== */}

      <ProjectDrawer
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />

    </div>
  </div>
)
}