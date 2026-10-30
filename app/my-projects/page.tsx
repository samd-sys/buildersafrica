
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FolderOpen,
  Loader2,
  Pencil,
  Trash2,
  AlertTriangle,
  MapPin,
  CalendarDays,
  Briefcase,
  Clock,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Project = {
  id: string;
  title: string;
  description: string;
  category: string;
  stage: string;
  location: string;
  logo_url: string;
  tech_stack: string[] | string;
  team_needs: string[] | string;
  created_at: string;
};

type Application = {
  id: string;
  project_id: string;
  position_id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  position_title: string;
  project_title: string;
  project_logo: string;
};

type Tab = "projects" | "applications";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STAGE_META: Record<string, { emoji: string; color: string }> = {
  Idea: {
    emoji: "",
    color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  },
  Planning: {
    emoji: "",
    color: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  },
  Design: {
    emoji: "",
    color: "text-pink-400 bg-pink-400/10 border-pink-400/20",
  },
  Development: {
    emoji: "",
    color: "text-[#00AFEF] bg-[#00AFEF]/10 border-[#00AFEF]/20",
  },
  Testing: {
    emoji: "",
    color: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  },
  Live: {
    emoji: "",
    color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  },
};

const GRADIENTS = [
  "from-[#00AFEF]/20 via-blue-900/40 to-indigo-900/60",
  "from-blue-900/80 via-blue-800/60 to-cyan-900/80",
  "from-emerald-900/80 via-emerald-800/60 to-teal-900/80",
  "from-rose-900/80 via-rose-800/60 to-pink-900/80",
  "from-orange-900/80 via-orange-800/60 to-amber-900/80",
  "from-violet-900/80 via-violet-800/60 to-blue-900/80",
];

function gradientForId(id: string) {
  const index =
    id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
    GRADIENTS.length;

  return GRADIENTS[index];
}

function normArray(val: string[] | string | null | undefined): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;

  if (typeof val === "string") {
    const trimmed = val.trim();

    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
      } catch {
        // Fall through
      }
    }

    return trimmed
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  return [];
}

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

// ─── Project Card ─────────────────────────────────────────────────────────────

function ProjectCard({
  project,
  onDelete,
}: {
  project: Project;
  onDelete: (id: string) => Promise<void>;
}) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const stage = STAGE_META[project.stage] ?? null;
  const gradient = gradientForId(project.id);
  const techStack = normArray(project.tech_stack);

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(project.id);
    setIsDeleting(false);
    setConfirmDelete(false);
  };

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-200 hover:border-[#00AFEF]/40">
      {/* Banner */}
      <div
        className={`relative h-36 overflow-hidden bg-gradient-to-br ${gradient}`}
      >
        {project.logo_url ? (
          <img
            src={project.logo_url}
            alt={project.title}
            className="h-full w-full object-cover opacity-60"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="select-none text-5xl font-black tracking-tighter text-white/30">
              {project.title.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}

        {stage && (
          <div
            className={`absolute left-3 top-3 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm ${stage.color}`}
          >
            {stage.emoji} {project.stage}
          </div>
        )}

        {project.category && (
          <div className="absolute right-3 top-3 max-w-[65%] truncate rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
            {project.category}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="space-y-1">
          <h3 className="break-words text-lg font-bold leading-tight text-foreground">
            {project.title}
          </h3>

          <p className="line-clamp-2 text-xs leading-relaxed text-muted">
            {project.description || "No description provided."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
          {project.location && (
            <span className="flex items-center gap-1 break-words">
              <MapPin size={11} className="shrink-0" />
              {project.location}
            </span>
          )}

          {project.created_at && (
            <span className="flex items-center gap-1">
              <CalendarDays size={11} className="shrink-0" />
              {formatDate(project.created_at)}
            </span>
          )}
        </div>

        {techStack.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {techStack.slice(0, 3).map((tech) => (
              <span
                key={tech}
                className="rounded-full border border-[#00AFEF]/20 bg-[#00AFEF]/[0.07] px-2.5 py-0.5 text-[11px] font-medium text-[#00AFEF]"
              >
                {tech}
              </span>
            ))}

            {techStack.length > 3 && (
              <span className="rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted">
                +{techStack.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="border-t border-border px-3 py-3 sm:px-5">
        {confirmDelete ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-1.5 text-xs text-red-400">
              <AlertTriangle size={13} className="shrink-0" />
              <span>Delete this project?</span>
            </div>

            <div className="flex items-center justify-end gap-2 sm:ml-auto">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:text-foreground"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-60"
              >
                {isDeleting ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <Trash2 size={11} />
                )}

                {isDeleting ? "Deleting..." : "Yes, delete"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push(`/edit-project/${project.id}`)}
              className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-surface-secondary py-2 text-xs font-medium text-foreground transition-colors hover:border-[#00AFEF]/40 hover:text-[#00AFEF]"
            >
              <Pencil size={12} className="shrink-0" />
              Edit
            </button>

            <button
              type="button"
              onClick={() => router.push(`/team/${project.id}`)}
              className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-surface-secondary py-2 text-xs font-medium text-foreground transition-colors hover:border-[#00AFEF]/40 hover:text-[#00AFEF]"
            >
              Team
            </button>

            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-surface-secondary py-2 text-xs font-medium text-muted transition-colors hover:border-red-500/30 hover:text-red-400"
            >
              <Trash2 size={12} className="shrink-0" />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Application Card ─────────────────────────────────────────────────────────

function ApplicationCard({ app }: { app: Application }) {
  const router = useRouter();

  const statusConfig = {
    pending: {
      icon: Clock,
      color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
      label: "Pending",
    },
    accepted: {
      icon: CheckCircle2,
      color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
      label: "Accepted",
    },
    rejected: {
      icon: Clock,
      color: "text-red-400 bg-red-400/10 border-red-400/20",
      label: "Rejected",
    },
  };

  const config = statusConfig[app.status];
  const StatusIcon = config.icon;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface px-3 py-4 transition-all hover:border-[#00AFEF]/40 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
      {/* Project logo */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface-secondary">
        {app.project_logo ? (
          <img
            src={app.project_logo}
            alt={app.project_title}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-sm font-black text-muted">
            {app.project_title.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1 space-y-1">
        <p className="break-words text-sm font-semibold text-foreground">
          {app.project_title}
        </p>

        <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted">
          <Briefcase size={11} className="shrink-0" />
          <span className="break-words text-[#00AFEF]">
            {app.position_title}
          </span>
        </div>

        <p className="text-[11px] text-muted">
          Applied {formatDate(app.created_at)}
        </p>
      </div>

      {/* Status and team action */}
      <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-start">
        <div
          className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold sm:px-3 sm:text-xs ${config.color}`}
        >
          <StatusIcon size={11} />
          {config.label}
        </div>

        {app.status === "accepted" && (
          <button
            type="button"
            onClick={() => router.push(`/team/${app.project_id}`)}
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-[#00AFEF]/20 bg-[#00AFEF]/5 px-2.5 py-1.5 text-xs font-semibold text-[#00AFEF] transition-colors hover:bg-[#00AFEF]/10 sm:px-3"
          >
            View Team
            <ArrowRight size={11} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyProjectsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("projects");
  const [projects, setProjects] = useState<Project[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [appsLoading, setAppsLoading] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  useEffect(() => {
    const handleSidebarHover = (event: CustomEvent) => {
      setIsSidebarHovered(event.detail.isHovered);
    };

    window.addEventListener(
      "sidebarHover",
      handleSidebarHover as EventListener
    );

    return () =>
      window.removeEventListener(
        "sidebarHover",
        handleSidebarHover as EventListener
      );
  }, []);

  // Load my created projects
  const loadMyProjects = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error) setProjects(data || []);

    setLoading(false);
  };

  // Load my applications (pending + accepted only)
  const loadMyApplications = async () => {
    setAppsLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setAppsLoading(false);
      return;
    }

    const { data: apps } = await supabase
      .from("project_applications")
      .select(
        "id, project_id, position_id, status, created_at, project_positions(title), projects(title, logo_url)"
      )
      .eq("applicant_id", user.id)
      .in("status", ["pending", "accepted"])
      .order("created_at", { ascending: false });

    if (apps) {
      const enriched: Application[] = apps.map((a: any) => ({
        id: a.id,
        project_id: a.project_id,
        position_id: a.position_id,
        status: a.status,
        created_at: a.created_at,
        position_title: a.project_positions?.title || "Unknown Position",
        project_title: a.projects?.title || "Unknown Project",
        project_logo: a.projects?.logo_url || "",
      }));

      setApplications(enriched);
    }

    setAppsLoading(false);
  };

  useEffect(() => {
    loadMyProjects();
  }, []);

  // Load applications when tab is first switched to
  useEffect(() => {
    if (activeTab === "applications" && applications.length === 0) {
      loadMyApplications();
    }
  }, [activeTab]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("projects").delete().eq("id", id);

    if (error) {
      alert(error.message);
    } else {
      setProjects((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const pendingCount = applications.filter(
    (a) => a.status === "pending"
  ).length;

  const acceptedCount = applications.filter(
    (a) => a.status === "accepted"
  ).length;

  return (
    <div
      className={`min-h-screen overflow-x-hidden bg-background text-foreground transition-all duration-500 ease-in-out ${
        isSidebarHovered ? "ml-0 md:ml-16" : "ml-0"
      }`}
      style={{
        transform: isSidebarHovered ? "scale(1.005)" : "scale(1)",
        filter: isSidebarHovered ? "brightness(0.98)" : "brightness(1)",
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <div className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-4 sm:py-8 lg:px-6 lg:py-10">
        <div className="rounded-2xl border border-border bg-surface-secondary/60 p-3 sm:p-5">
          <div className="space-y-6 sm:space-y-8">
            {/* Header card */}
            <div className="flex flex-col gap-5 rounded-2xl border border-border bg-surface px-4 py-5 sm:px-6 sm:py-6 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:px-8 lg:py-8">
              <div className="min-w-0 space-y-1.5">
                <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                  My Projects
                </h1>

                <p className="max-w-xl text-sm text-muted">
                  Manage your created projects and track your applications.
                </p>
              </div>

              {/* Tab buttons */}
              <div className="flex w-full min-w-0 items-center gap-1 rounded-xl border border-border bg-surface-secondary p-1 sm:w-auto sm:gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("projects")}
                  aria-pressed={activeTab === "projects"}
                  className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-semibold transition-all sm:flex-none sm:gap-2 sm:px-4 sm:text-xs ${
                    activeTab === "projects"
                      ? "bg-surface text-foreground shadow-sm"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  <FolderOpen size={13} className="shrink-0" />
                  <span className="truncate">My Projects</span>

                  {projects.length > 0 && (
                    <span
                      className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        activeTab === "projects"
                          ? "bg-[#00AFEF]/20 text-[#00AFEF]"
                          : "bg-surface text-muted"
                      }`}
                    >
                      {projects.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("applications")}
                  aria-pressed={activeTab === "applications"}
                  className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-semibold transition-all sm:flex-none sm:gap-2 sm:px-4 sm:text-xs ${
                    activeTab === "applications"
                      ? "bg-surface text-foreground shadow-sm"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  <Briefcase size={13} className="shrink-0" />
                  <span className="truncate">My Applications</span>

                  {applications.length > 0 && (
                    <span
                      className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        activeTab === "applications"
                          ? "bg-[#00AFEF]/20 text-[#00AFEF]"
                          : "bg-surface text-muted"
                      }`}
                    >
                      {applications.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* ── MY PROJECTS TAB ── */}
            {activeTab === "projects" && (
              <>
                {loading ? (
                  <div className="flex items-center justify-center py-24">
                    <Loader2
                      size={28}
                      className="animate-spin text-[#00AFEF]"
                    />
                  </div>
                ) : projects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-5 py-20 text-center sm:py-28">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-surface">
                      <FolderOpen size={36} className="text-muted" />
                    </div>

                    <div className="space-y-2">
                      <p className="text-xl font-bold text-foreground">
                        No projects yet
                      </p>

                      <p className="max-w-xs text-sm text-muted">
                        You haven't created any projects yet. Use the sidebar
                        to start a new one.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                    {projects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── MY APPLICATIONS TAB ── */}
            {activeTab === "applications" && (
              <>
                {appsLoading ? (
                  <div className="flex items-center justify-center py-24">
                    <Loader2
                      size={28}
                      className="animate-spin text-[#00AFEF]"
                    />
                  </div>
                ) : applications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-5 py-20 text-center sm:py-28">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-surface">
                      <Briefcase size={36} className="text-muted" />
                    </div>

                    <div className="space-y-2">
                      <p className="text-xl font-bold text-foreground">
                        No applications yet
                      </p>

                      <p className="max-w-xs text-sm text-muted">
                        You haven't applied to any projects yet. Browse projects
                        and apply for open positions.
                      </p>
                    </div>

                    <Link
                      href="/projects"
                      className="flex items-center gap-2 rounded-full border border-[#00AFEF]/20 bg-[#00AFEF]/5 px-5 py-2.5 text-sm font-semibold text-[#00AFEF] transition-colors hover:bg-[#00AFEF]/10"
                    >
                      Browse Projects →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Summary stats */}
                    <div className="grid w-full max-w-xs grid-cols-2 gap-3 sm:gap-4">
                      <div className="rounded-xl border border-border bg-surface px-3 py-3 text-center sm:px-4">
                        <p className="text-lg font-bold text-yellow-400">
                          {pendingCount}
                        </p>
                        <p className="text-[11px] text-muted">Pending</p>
                      </div>

                      <div className="rounded-xl border border-border bg-surface px-3 py-3 text-center sm:px-4">
                        <p className="text-lg font-bold text-emerald-400">
                          {acceptedCount}
                        </p>
                        <p className="text-[11px] text-muted">Accepted</p>
                      </div>
                    </div>

                    {/* Accepted first, then pending */}
                    {acceptedCount > 0 && (
                      <div className="space-y-3">
                        <h3 className="px-1 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                          ✅ Accepted — you're on the team
                        </h3>

                        {applications
                          .filter((a) => a.status === "accepted")
                          .map((app) => (
                            <ApplicationCard key={app.id} app={app} />
                          ))}
                      </div>
                    )}

                    {pendingCount > 0 && (
                      <div className="space-y-3">
                        <h3 className="px-1 text-xs font-semibold uppercase tracking-wider text-yellow-400">
                          ⏳ Pending review
                        </h3>

                        {applications
                          .filter((a) => a.status === "pending")
                          .map((app) => (
                            <ApplicationCard key={app.id} app={app} />
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
