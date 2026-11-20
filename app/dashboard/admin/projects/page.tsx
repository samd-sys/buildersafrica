
"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  AlertCircle,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Code2,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  FolderKanban,
  Globe2,
  Layers,
  Loader2,
  Lock,
  Mail,
  MapPin,
  RefreshCw,
  Search,
  Target,
  UserPlus,
  UserRound,
  Users,
  X,
} from "lucide-react";

// Supabase RPC responses have dynamic JSON columns that are read by key.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

type Project = {
  project_id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  stage?: string | null;
  location?: string | null;
  visibility?: string | null;
  logo_url?: string | null;
  tech_stack?: string | null;
  created_at?: string | null;
  founder_id?: string | null;
  founder_name?: string | null;
  founder_email?: string | null;
  active_members?: number | null;
  open_roles?: number | null;
  total_applications?: number | null;
  total_count?: number | null;
};

type ProjectStats = {
  total_projects: number;
  public_projects: number;
  private_projects: number;
  total_team_members: number;
  projects_this_month: number;
  total_open_roles: number;
  total_applications: number;
};

type FilterOptions = {
  categories: string[];
  stages: string[];
  visibilities: string[];
};

const PAGE_SIZE = 10;

const EMPTY_STATS: ProjectStats = {
  total_projects: 0,
  public_projects: 0,
  private_projects: 0,
  total_team_members: 0,
  projects_this_month: 0,
  total_open_roles: 0,
  total_applications: 0,
};

const EMPTY_FILTERS: FilterOptions = {
  categories: [],
  stages: [],
  visibilities: [],
};

function asNumber(value: unknown): number {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function formatDate(value?: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatLabel(value?: string | null) {
  if (!value) return "Not specified";

  return value
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getInitials(name?: string | null) {
  if (!name) return "U";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getArray(value: unknown): Row[] {
  return Array.isArray(value) ? value : [];
}

function getStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function getObject(value: unknown): Row {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Row)
    : {};
}

function getStatusClass(status?: string | null) {
  const value = (status ?? "").toLowerCase();

  if (["active", "approved", "accepted", "open", "public"].includes(value)) {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-500";
  }

  if (["pending", "in_review", "in progress"].includes(value)) {
    return "border-amber-500/20 bg-amber-500/10 text-amber-500";
  }

  if (
    ["rejected", "closed", "inactive", "suspended", "private"].includes(value)
  ) {
    return "border-red-500/20 bg-red-500/10 text-red-500";
  }

  return "border-border bg-surface-secondary text-muted";
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{title}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {value.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-muted">{description}</p>
        </div>

        <div className="rounded-xl bg-[#00AFEF]/10 p-3 text-[#00AFEF]">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ value }: { value?: string | null }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClass(
        value
      )}`}
    >
      {formatLabel(value)}
    </span>
  );
}

export default function AdminProjectsPage() {
  const [stats, setStats] = useState<ProjectStats>(EMPTY_STATS);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filterOptions, setFilterOptions] =
    useState<FilterOptions>(EMPTY_FILTERS);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [stage, setStage] = useState("");
  const [visibility, setVisibility] = useState("");

  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedProject, setSelectedProject] = useState<Row | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  // Debounce search input to avoid sending a request for every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);

    const request = supabase.rpc(
      "admin_project_stats"
    );

    const { data, error: rpcError } = await request;

    if (rpcError) {
      console.error("Admin project stats error:", rpcError);
      setStatsLoading(false);
      return;
    }

    const result = Array.isArray(data) ? data[0] : data;

    if (result) {
      setStats({
        total_projects: asNumber(result.total_projects),
        public_projects: asNumber(result.public_projects),
        private_projects: asNumber(result.private_projects),
        total_team_members: asNumber(result.total_team_members),
        projects_this_month: asNumber(result.projects_this_month),
        total_open_roles: asNumber(result.total_open_roles),
        total_applications: asNumber(result.total_applications),
      });
    }

    setStatsLoading(false);
  }, []);

  const loadFilterOptions = useCallback(async () => {
    const { data, error: rpcError } = await supabase.rpc(
      "admin_project_filter_options"
    );

    if (rpcError) {
      console.error("Project filter options error:", rpcError);
      return;
    }

    const result = Array.isArray(data) ? data[0] : data;

    if (result) {
      setFilterOptions({
        categories: getStringArray(result.categories),
        stages: getStringArray(result.stages),
        visibilities: getStringArray(result.visibilities),
      });
    }
  }, []);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError("");

    const request = supabase.rpc(
      "admin_list_projects",
      {
        p_search: debouncedSearch || null,
        p_category: category || null,
        p_stage: stage || null,
        p_visibility: visibility || null,
        p_page: page,
        p_page_size: PAGE_SIZE,
      }
    );

    const { data, error: rpcError } = await request;

    if (rpcError) {
      console.error("Admin projects error:", rpcError);
      setError(rpcError.message || "Unable to load projects.");
      setProjects([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }

    const rows = getArray(data) as Project[];

    setProjects(rows);
    setTotalCount(asNumber(rows[0]?.total_count));
    setLoading(false);
  }, [debouncedSearch, category, stage, visibility, page]);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadStats(), loadFilterOptions(), loadProjects()]);
  }, [loadStats, loadFilterOptions, loadProjects]);

  useEffect(() => {
    void Promise.resolve().then(() => {
      void loadStats();
      void loadFilterOptions();
    });
  }, [loadStats, loadFilterOptions]);

  useEffect(() => {
    void Promise.resolve().then(() => {
      void loadProjects();
    });
  }, [loadProjects]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const showingFrom = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(page * PAGE_SIZE, totalCount);

  const hasActiveFilters = Boolean(
    search || category || stage || visibility
  );

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setCategory("");
    setStage("");
    setVisibility("");
    setPage(1);
  };

  const openProjectDetails = async (projectId: string) => {
    setDetailsLoading(true);
    setDetailsError("");
    setSelectedProject(null);

    const { data, error: rpcError } = await supabase.rpc(
      "admin_get_project_details",
      {
        p_project_id: projectId,
      }
    );

    if (rpcError) {
      console.error("Project details error:", rpcError);
      setDetailsError(rpcError.message || "Unable to load project details.");
      setDetailsLoading(false);
      return;
    }

    const result = Array.isArray(data) ? data[0] : data;
    const details = getObject(result);

    if (!Object.keys(details).length) {
      setDetailsError("No project details were returned.");
      setDetailsLoading(false);
      return;
    }

    setSelectedProject(details);
    setDetailsLoading(false);
  };

  const closeDetails = () => {
    setSelectedProject(null);
    setDetailsError("");
  };

  const details = selectedProject ?? {};

  // Support both nested JSON results and project details returned at the root.
  const projectInfo = getObject(
    details.project ?? details.project_details ?? details
  );

  const founderInfo = getObject(
    details.founder ?? details.project_founder ?? projectInfo.founder
  );

  const teamMembers = getArray(
    details.team_members ?? details.members ?? projectInfo.team_members
  );

  const projectRoles = getArray(
    details.roles ?? details.project_roles ?? projectInfo.roles
  );

  const totalRoleApplications = projectRoles.reduce((total, role) => {
    const applications = getArray(role.applications);
    return total + applications.length;
  }, 0);

  const projectTitle =
    asString(projectInfo.title) ||
    asString(details.title) ||
    "Project details";

  return (
    <div className="space-y-7 pb-10">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-muted">
            <FolderKanban size={16} />
            <span>Administration</span>
            <span>/</span>
            <span className="text-foreground">Projects</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Project Management
          </h1>

          <p className="mt-1 text-sm text-muted">
            Monitor projects, founders, teams, open roles and applications
            across BuildersAfrica.
          </p>
        </div>

        <button
          type="button"
          onClick={refreshAll}
          disabled={loading || statsLoading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading || statsLoading ? "animate-spin" : ""}
          />
          Refresh data
        </button>
      </div>

      {/* Statistics */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">
            Platform overview  
          </h2>
          {statsLoading && (
            <span className="flex items-center gap-2 text-xs text-muted">
              <Loader2 size={13} className="animate-spin" />
              Updating statistics
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total projects"
            value={stats.total_projects}
            description="All registered projects"
            icon={FolderKanban}
          />
          <StatCard
            title="Public projects"
            value={stats.public_projects}
            description="Projects visible publicly"
            icon={Globe2}
          />
          <StatCard
            title="Private projects"
            value={stats.private_projects}
            description="Projects with restricted visibility"
            icon={Lock}
          />
          <StatCard
            title="Team members"
            value={stats.total_team_members}
            description="Active project memberships"
            icon={Users}
          />
          <StatCard
            title="Created this month"
            value={stats.projects_this_month}
            description="New projects this month"
            icon={CalendarDays}
          />
          <StatCard
            title="Open positions"
            value={stats.total_open_roles}
            description="Roles currently accepting applications"
            icon={BriefcaseBusiness}
          />
          <StatCard
            title="Applications"
            value={stats.total_applications}
            description="Applications submitted to projects"
            icon={FileText}
          />
          <StatCard
            title="Project activity"
            value={stats.total_projects + stats.total_applications}
            description="Projects plus submitted applications"
            icon={Layers}
          />
        </div>
      </section>

      {/* Projects directory */}
      <section className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="border-b border-border p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Registered projects
              </h2>
              <p className="mt-1 text-sm text-muted">
                Search and review projects registered on the platform.
              </p>
            </div>

            <div className="text-sm text-muted">
              {totalCount.toLocaleString()} project
              {totalCount === 1 ? "" : "s"} found
            </div>
          </div>

          {/* Search and filters */}
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="relative sm:col-span-2 xl:col-span-1">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search title, founder or email..."
                className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-[#00AFEF]"
              />
            </div>

            <select
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-[#00AFEF]"
            >
              <option value="">All categories</option>
              {filterOptions.categories.map((item) => (
                <option key={item} value={item}>
                  {formatLabel(item)}
                </option>
              ))}
            </select>

            <select
              value={stage}
              onChange={(event) => {
                setStage(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-[#00AFEF]"
            >
              <option value="">All stages</option>
              {filterOptions.stages.map((item) => (
                <option key={item} value={item}>
                  {formatLabel(item)}
                </option>
              ))}
            </select>

            <select
              value={visibility}
              onChange={(event) => {
                setVisibility(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-[#00AFEF]"
            >
              <option value="">All visibility</option>
              {filterOptions.visibilities.map((item) => (
                <option key={item} value={item}>
                  {formatLabel(item)}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-xs text-muted">
                <Filter size={13} />
                Filters are active
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-medium text-[#00AFEF] hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="m-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-500">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Unable to load projects</p>
              <p className="mt-1 break-words">{error}</p>
              <button
                type="button"
                onClick={loadProjects}
                className="mt-2 font-medium underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-8">
            <Loader2 size={28} className="animate-spin text-[#00AFEF]" />
            <p className="text-sm text-muted">Loading registered projects...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && projects.length === 0 && (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 py-12 text-center">
            <div className="rounded-2xl bg-surface-secondary p-4 text-muted">
              <FolderKanban size={28} />
            </div>
            <h3 className="mt-4 font-semibold text-foreground">
              No projects found
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted">
              {hasActiveFilters
                ? "Try changing your search or filters."
                : "Projects registered by users will appear here."}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 text-sm font-medium text-[#00AFEF] hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Project list */}
        {!loading && !error && projects.length > 0 && (
          <>
            <div className="divide-y divide-border">
              {projects.map((project) => (
                <div
                  key={project.project_id}
                  className="flex flex-col gap-4 p-5 transition hover:bg-surface-secondary/40 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    {project.logo_url ? (
                      <img
                        src={project.logo_url}
                        alt={`${project.title} logo`}
                        className="h-12 w-12 shrink-0 rounded-xl border border-border bg-background object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-secondary text-[#00AFEF]">
                        <FolderKanban size={21} />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-semibold text-foreground">
                          {project.title}
                        </h3>
                        <StatusBadge value={project.visibility} />
                      </div>

                      <p className="mt-1 line-clamp-2 text-sm text-muted">
                        {project.description || "No description provided."}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
                        <span className="inline-flex items-center gap-1.5">
                          <UserRound size={13} />
                          {project.founder_name || "Unknown founder"}
                        </span>

                        {project.category && (
                          <span className="inline-flex items-center gap-1.5">
                            <Layers size={13} />
                            {formatLabel(project.category)}
                          </span>
                        )}

                        {project.location && (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin size={13} />
                            {project.location}
                          </span>
                        )}

                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays size={13} />
                          {formatDate(project.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 sm:w-52 sm:shrink-0">
                    <div className="text-center">
                      <p className="text-lg font-semibold text-foreground">
                        {asNumber(project.active_members)}
                      </p>
                      <p className="text-[11px] text-muted">Members</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-foreground">
                        {asNumber(project.open_roles)}
                      </p>
                      <p className="text-[11px] text-muted">Open roles</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-foreground">
                        {asNumber(project.total_applications)}
                      </p>
                      <p className="text-[11px] text-muted">Applications</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openProjectDetails(project.project_id)}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition hover:border-[#00AFEF] hover:text-[#00AFEF]"
                  >
                    <Eye size={16} />
                    View details
                  </button>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted">
                Showing {showingFrom}–{showingTo} of{" "}
                {totalCount.toLocaleString()} projects
              </p>

              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm text-foreground transition hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <span className="px-2 text-xs text-muted">
                  Page {page} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                  disabled={page >= totalPages}
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm text-foreground transition hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Project details loading / error modal */}
      {(detailsLoading || detailsError) && !selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            {detailsLoading ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Loader2
                  size={30}
                  className="animate-spin text-[#00AFEF]"
                />
                <p className="mt-4 font-medium text-foreground">
                  Loading project details
                </p>
                <p className="mt-1 text-sm text-muted">
                  Retrieving founder, team and application information...
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 text-red-500">
                  <AlertCircle size={22} />
                  <h3 className="font-semibold">Could not load details</h3>
                </div>
                <p className="mt-3 break-words text-sm text-muted">
                  {detailsError}
                </p>
                <button
                  type="button"
                  onClick={closeDetails}
                  className="mt-5 w-full rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface-secondary"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Project details modal */}
      {selectedProject && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-3 backdrop-blur-sm sm:p-6"
          onClick={closeDetails}
        >
          <div className="flex min-h-full items-start justify-center py-4 sm:items-center">
            <div
              className="w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-start justify-between gap-4 border-b border-border p-5 sm:p-6">
                <div className="flex min-w-0 items-start gap-3">
                  {projectInfo.logo_url ? (
                    <img
                      src={projectInfo.logo_url}
                      alt={`${projectTitle} logo`}
                      className="h-14 w-14 shrink-0 rounded-xl border border-border object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#00AFEF]/10 text-[#00AFEF]">
                      <FolderKanban size={25} />
                    </div>
                  )}

                  <div className="min-w-0">
                    <h2 className="break-words text-xl font-semibold text-foreground">
                      {projectTitle}
                    </h2>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <StatusBadge
                        value={projectInfo.visibility ?? details.visibility}
                      />
                      <StatusBadge value={projectInfo.stage ?? details.stage} />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeDetails}
                  aria-label="Close project details"
                  className="rounded-lg p-2 text-muted transition hover:bg-surface-secondary hover:text-foreground"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="max-h-[75vh] space-y-6 overflow-y-auto p-5 sm:p-6">
                {/* Project summary */}
                <section>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <FileText size={17} className="text-[#00AFEF]" />
                    Project information
                  </h3>

                  <p className="whitespace-pre-wrap text-sm leading-6 text-muted">
                    {projectInfo.description ||
                      details.description ||
                      "No project description has been provided."}
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-border bg-background p-3">
                      <p className="text-xs text-muted">Category</p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {formatLabel(
                          projectInfo.category ?? details.category
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border bg-background p-3">
                      <p className="text-xs text-muted">Project stage</p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {formatLabel(projectInfo.stage ?? details.stage)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border bg-background p-3">
                      <p className="text-xs text-muted">Location</p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {asString(projectInfo.location ?? details.location) ||
                          "Not specified"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border bg-background p-3">
                      <p className="text-xs text-muted">Created</p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {formatDate(
                          projectInfo.created_at ?? details.created_at
                        )}
                      </p>
                    </div>
                  </div>
                </section>

                {/* Problem and vision */}
                {(projectInfo.problem_statement ||
                  details.problem_statement ||
                  projectInfo.vision ||
                  details.vision) && (
                  <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {(projectInfo.problem_statement ||
                      details.problem_statement) && (
                      <div className="rounded-xl border border-border p-4">
                        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                          <Target size={16} className="text-[#00AFEF]" />
                          Problem statement
                        </h3>
                        <p className="whitespace-pre-wrap text-sm leading-6 text-muted">
                          {projectInfo.problem_statement ??
                            details.problem_statement}
                        </p>
                      </div>
                    )}

                    {(projectInfo.vision || details.vision) && (
                      <div className="rounded-xl border border-border p-4">
                        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                          <CheckCircle2
                            size={16}
                            className="text-[#00AFEF]"
                          />
                          Project vision
                        </h3>
                        <p className="whitespace-pre-wrap text-sm leading-6 text-muted">
                          {projectInfo.vision ?? details.vision}
                        </p>
                      </div>
                    )}
                  </section>
                )}

                {/* Technology and needs */}
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-border p-4">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Code2 size={16} className="text-[#00AFEF]" />
                      Technology stack
                    </h3>
                    <p className="whitespace-pre-wrap text-sm text-muted">
                      {asString(
                        projectInfo.tech_stack ?? details.tech_stack
                      ) || "No technology stack specified."}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border p-4">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                      <UserPlus size={16} className="text-[#00AFEF]" />
                      Team needs
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {getArray(
                        projectInfo.team_needs ?? details.team_needs
                      ).length > 0 ? (
                        getArray(
                          projectInfo.team_needs ?? details.team_needs
                        ).map((need, index) => (
                          <span
                            key={`${String(need)}-${index}`}
                            className="rounded-lg bg-surface-secondary px-2.5 py-1.5 text-xs text-foreground"
                          >
                            {String(need)}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-muted">
                          No team needs specified.
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                {/* Founder */}
                <section>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <UserRound size={17} className="text-[#00AFEF]" />
                    Project founder
                  </h3>

                  <div className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4 sm:flex-row sm:items-center">
                    {founderInfo.avatar_url ? (
                      <img
                        src={founderInfo.avatar_url}
                        alt="Founder"
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#00AFEF]/10 font-semibold text-[#00AFEF]">
                        {getInitials(
                          founderInfo.full_name ??
                            projectInfo.founder_name ??
                            details.founder_name
                        )}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">
                        {asString(
                          founderInfo.full_name ??
                            projectInfo.founder_name ??
                            details.founder_name
                        ) || "Founder name unavailable"}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 break-all text-sm text-muted">
                        <Mail size={13} />
                        {asString(
                          founderInfo.email ??
                            projectInfo.founder_email ??
                            details.founder_email
                        ) || "Email unavailable"}
                      </p>
                      {founderInfo.professional_title && (
                        <p className="mt-1 text-xs text-muted">
                          {founderInfo.professional_title}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {founderInfo.github_url && (
                        <a
                          href={founderInfo.github_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs text-foreground hover:border-[#00AFEF] hover:text-[#00AFEF]"
                        >
                          <Code2 size={13} />
                          GitHub
                          <ExternalLink size={11} />
                        </a>
                      )}

                      {founderInfo.linkedin_url && (
                        <a
                          href={founderInfo.linkedin_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs text-foreground hover:border-[#00AFEF] hover:text-[#00AFEF]"
                        >
                          <UserRound size={13} />
                          LinkedIn
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  </div>
                </section>

                {/* Team members */}
                <section>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Users size={17} className="text-[#00AFEF]" />
                      Team members
                    </h3>
                    <span className="text-xs text-muted">
                      {teamMembers.length} member
                      {teamMembers.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  {teamMembers.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted">
                      No team members have joined this project yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-border rounded-xl border border-border">
                      {teamMembers.map((member, index) => {
                        const profile = getObject(member.profile);
                        const name =
                          member.full_name ??
                          profile.full_name ??
                          member.name ??
                          "Unknown member";

                        return (
                          <div
                            key={member.user_id ?? member.id ?? index}
                            className="flex items-center gap-3 p-3"
                          >
                            {profile.avatar_url || member.avatar_url ? (
                              <img
                                src={
                                  profile.avatar_url ?? member.avatar_url
                                }
                                alt={String(name)}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-secondary text-xs font-semibold text-foreground">
                                {getInitials(String(name))}
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-foreground">
                                {String(name)}
                              </p>
                              <p className="mt-0.5 text-xs text-muted">
                                {asString(
                                  member.role ?? member.role_name
                                ) || "Team member"}
                              </p>
                            </div>

                            <StatusBadge
                              value={member.status ?? "active"}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* Project roles and applications */}
                <section>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <BriefcaseBusiness
                        size={17}
                        className="text-[#00AFEF]"
                      />
                      Project roles and applications
                    </h3>
                    <span className="text-xs text-muted">
                      {projectRoles.length} role
                      {projectRoles.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  {projectRoles.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted">
                      This project has not published any roles.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {projectRoles.map((role, index) => {
                        const applications = getArray(role.applications);

                        return (
                          <div
                            key={role.id ?? index}
                            className="overflow-hidden rounded-xl border border-border"
                          >
                            <div className="flex flex-col justify-between gap-3 bg-background p-4 sm:flex-row sm:items-center">
                              <div>
                                <h4 className="font-medium text-foreground">
                                  {asString(role.role_name ?? role.title) ||
                                    "Untitled role"}
                                </h4>
                                <p className="mt-1 text-xs text-muted">
                                  {formatLabel(role.experience_level)}
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <StatusBadge value={role.status} />
                                <span className="rounded-lg bg-surface-secondary px-2.5 py-1.5 text-xs text-muted">
                                  {asNumber(role.filled_positions)} /{" "}
                                  {asNumber(role.positions)} filled
                                </span>
                                <span className="rounded-lg bg-[#00AFEF]/10 px-2.5 py-1.5 text-xs font-medium text-[#00AFEF]">
                                  {applications.length} applications
                                </span>
                              </div>
                            </div>

                            {role.description && (
                              <p className="border-t border-border px-4 py-3 text-sm leading-6 text-muted">
                                {role.description}
                              </p>
                            )}

                            {getArray(role.required_skills).length > 0 && (
                              <div className="flex flex-wrap gap-2 border-t border-border px-4 py-3">
                                {getArray(role.required_skills).map(
                                  (skill, skillIndex) => (
                                    <span
                                      key={`${String(skill)}-${skillIndex}`}
                                      className="rounded-md bg-surface-secondary px-2 py-1 text-xs text-muted"
                                    >
                                      {String(skill)}
                                    </span>
                                  )
                                )}
                              </div>
                            )}

                            {applications.length > 0 && (
                              <div className="border-t border-border">
                                <div className="px-4 py-3">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                                    Applicants
                                  </p>
                                </div>

                                <div className="divide-y divide-border">
                                  {applications.map(
                                    (application, applicationIndex) => {
                                      const applicant = getObject(
                                        application.applicant ??
                                          application.profile
                                      );

                                      const applicantName =
                                        application.applicant_name ??
                                        applicant.full_name ??
                                        application.full_name ??
                                        "Unknown applicant";

                                      return (
                                        <div
                                          key={
                                            application.id ?? applicationIndex
                                          }
                                          className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                                        >
                                          <div className="min-w-0">
                                            <p className="text-sm font-medium text-foreground">
                                              {String(applicantName)}
                                            </p>
                                            <p className="mt-0.5 break-all text-xs text-muted">
                                              {asString(
                                                application.applicant_email ??
                                                  applicant.email ??
                                                  application.email
                                              ) || "Email unavailable"}
                                            </p>
                                          </div>

                                          <div className="flex items-center gap-2">
                                            <StatusBadge
                                              value={application.status}
                                            />
                                            <span className="text-xs text-muted">
                                              {formatDate(
                                                application.created_at
                                              )}
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* Additional metadata */}
                <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl bg-background p-3">
                    <p className="text-xs text-muted">Team members</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {teamMembers.length}
                    </p>
                  </div>
                  <div className="rounded-xl bg-background p-3">
                    <p className="text-xs text-muted">Roles</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {projectRoles.length}
                    </p>
                  </div>
                  <div className="rounded-xl bg-background p-3">
                    <p className="text-xs text-muted">Applications listed</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {totalRoleApplications}
                    </p>
                  </div>
                  <div className="rounded-xl bg-background p-3">
                    <p className="text-xs text-muted">Created</p>
                    <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-foreground">
                      <Clock3 size={13} />
                      {formatDate(
                        projectInfo.created_at ?? details.created_at
                      )}
                    </p>
                  </div>
                </section>
              </div>

              {/* Modal footer */}
              <div className="flex justify-end border-t border-border p-4">
                <button
                  type="button"
                  onClick={closeDetails}
                  className="rounded-xl bg-[#00AFEF] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#009bd5]"
                >
                  Close details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
