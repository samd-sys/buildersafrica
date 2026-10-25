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
  Idea:        { emoji: "", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
  Planning:    { emoji: "", color: "text-blue-400 bg-blue-400/10 border-blue-400/20"     },
  Design:      { emoji: "", color: "text-pink-400 bg-pink-400/10 border-pink-400/20"     },
  Development: { emoji: "", color: "text-[#00AFEF] bg-[#00AFEF]/10 border-[#00AFEF]/20" },
  Testing:     { emoji: "", color: "text-orange-400 bg-orange-400/10 border-orange-400/20" },
  Live:        { emoji: "", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
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
  const index = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % GRADIENTS.length;
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
      } catch { /* fall through */ }
    }
    return trimmed.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch { return "—"; }
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
  const [isDeleting, setIsDeleting]       = useState(false);
  const stage     = STAGE_META[project.stage] ?? null;
  const gradient  = gradientForId(project.id);
  const techStack = normArray(project.tech_stack);

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(project.id);
    setIsDeleting(false);
    setConfirmDelete(false);
  };

  return (
    <div className="group flex flex-col rounded-2xl border border-[#1F1F23] bg-[#121215] overflow-hidden transition-all duration-200 hover:border-[#00AFEF]/20">
      {/* Banner */}
      <div className={`relative h-36 bg-gradient-to-br ${gradient} overflow-hidden`}>
        {project.logo_url ? (
          <img src={project.logo_url} alt={project.title} className="h-full w-full object-cover opacity-60" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl font-black text-white/10 select-none tracking-tighter">
              {project.title.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}
        {stage && (
          <div className={`absolute top-3 left-3 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm ${stage.color}`}>
            {stage.emoji} {project.stage}
          </div>
        )}
        {project.category && (
          <div className="absolute top-3 right-3 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
            {project.category}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5 gap-3">
        <div className="space-y-1">
          <h3 className="font-bold text-white text-lg leading-tight">{project.title}</h3>
          <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
            {project.description || "No description provided."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
          {project.location && (
            <span className="flex items-center gap-1"><MapPin size={11} />{project.location}</span>
          )}
          {project.created_at && (
            <span className="flex items-center gap-1"><CalendarDays size={11} />{formatDate(project.created_at)}</span>
          )}
        </div>
        {techStack.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {techStack.slice(0, 3).map((tech) => (
              <span key={tech} className="rounded-full border border-[#00AFEF]/20 bg-[#00AFEF]/[0.07] px-2.5 py-0.5 text-[11px] font-medium text-[#00AFEF]">
                {tech}
              </span>
            ))}
            {techStack.length > 3 && (
              <span className="rounded-full border border-[#1F1F23] px-2.5 py-0.5 text-[11px] text-gray-500">
                +{techStack.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="border-t border-[#1F1F23] px-5 py-3">
        {confirmDelete ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-red-400">
              <AlertTriangle size={13} />
              <span>Delete this project?</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg border border-[#1F1F23] px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-1.5 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-60"
              >
                {isDeleting ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                {isDeleting ? "Deleting..." : "Yes, delete"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/edit-project/${project.id}`)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#1F1F23] bg-[#0F0F11] py-2 text-xs font-medium text-gray-300 hover:border-[#00AFEF]/30 hover:text-[#00AFEF] transition-colors"
            >
              <Pencil size={12} />
              Edit
            </button>
            <button
              onClick={() => router.push(`/team/${project.id}`)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#1F1F23] bg-[#0F0F11] py-2 text-xs font-medium text-gray-300 hover:border-[#00AFEF]/30 hover:text-[#00AFEF] transition-colors"
            >
              Team
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#1F1F23] bg-[#0F0F11] py-2 text-xs font-medium text-gray-400 hover:border-red-500/20 hover:text-red-400 transition-colors"
            >
              <Trash2 size={12} />
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
    pending:  { icon: Clock,         color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20", label: "Pending"  },
    accepted: { icon: CheckCircle2,  color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", label: "Accepted" },
    rejected: { icon: Clock,         color: "text-red-400 bg-red-400/10 border-red-400/20", label: "Rejected" },
  };

  const config = statusConfig[app.status];
  const StatusIcon = config.icon;

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[#1F1F23] bg-[#121215] px-5 py-4 transition-all hover:border-[#00AFEF]/20">
      {/* Project logo */}
      <div className="h-12 w-12 rounded-xl border border-[#1F1F23] bg-[#0F0F11] overflow-hidden flex items-center justify-center shrink-0">
        {app.project_logo ? (
          <img src={app.project_logo} alt={app.project_title} className="h-full w-full object-cover" />
        ) : (
          <span className="text-sm font-black text-white/20">
            {app.project_title.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-semibold text-white truncate">{app.project_title}</p>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Briefcase size={11} />
          <span className="text-[#00AFEF]">{app.position_title}</span>
        </div>
        <p className="text-[11px] text-gray-600">Applied {formatDate(app.created_at)}</p>
      </div>

      {/* Status badge */}
      <div className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold shrink-0 ${config.color}`}>
        <StatusIcon size={11} />
        {config.label}
      </div>

      {/* View Team link — only for accepted */}
      {app.status === "accepted" && (
        <button
          onClick={() => router.push(`/team/${app.project_id}`)}
          className="flex items-center gap-1.5 rounded-xl border border-[#00AFEF]/20 bg-[#00AFEF]/5 px-3 py-1.5 text-xs font-semibold text-[#00AFEF] hover:bg-[#00AFEF]/10 transition-colors shrink-0"
        >
          View Team
          <ArrowRight size={11} />
        </button>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyProjectsPage() {
  const [activeTab,    setActiveTab]    = useState<Tab>("projects");
  const [projects,     setProjects]     = useState<Project[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [appsLoading,  setAppsLoading]  = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  useEffect(() => {
    const handleSidebarHover = (event: CustomEvent) => {
      setIsSidebarHovered(event.detail.isHovered);
    };
    window.addEventListener("sidebarHover", handleSidebarHover as EventListener);
    return () =>
      window.removeEventListener("sidebarHover", handleSidebarHover as EventListener);
  }, []);

  // Load my created projects
  const loadMyProjects = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setAppsLoading(false); return; }

    const { data: apps } = await supabase
      .from("project_applications")
      .select("id, project_id, position_id, status, created_at, project_positions(title), projects(title, logo_url)")
      .eq("applicant_id", user.id)
      .in("status", ["pending", "accepted"])
      .order("created_at", { ascending: false });

    if (apps) {
      const enriched: Application[] = apps.map((a: any) => ({
        id:            a.id,
        project_id:    a.project_id,
        position_id:   a.position_id,
        status:        a.status,
        created_at:    a.created_at,
        position_title: a.project_positions?.title || "Unknown Position",
        project_title:  a.projects?.title          || "Unknown Project",
        project_logo:   a.projects?.logo_url       || "",
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

  const pendingCount  = applications.filter((a) => a.status === "pending").length;
  const acceptedCount = applications.filter((a) => a.status === "accepted").length;

  return (
    <div
      className={`min-h-screen bg-[#09090B] text-white transition-all duration-500 ease-in-out ${
        isSidebarHovered ? "ml-16" : "ml-0"
      }`}
      style={{
        transform:  isSidebarHovered ? "scale(1.005)" : "scale(1)",
        filter:     isSidebarHovered ? "brightness(0.98)" : "brightness(1)",
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="rounded-2xl border border-white/20 bg-[#0F0F11]/60 p-4 sm:p-5">
          <div className="space-y-8">
            {/* Header card */}
            <div className="rounded-2xl border border-[#1F1F23] bg-[#0F0F11] px-8 py-8 flex items-center justify-between gap-6">
              <div className="space-y-1.5">
                <h1 className="text-3xl font-bold text-white">My Projects</h1>
                <p className="text-sm text-gray-400">
                  Manage your created projects and track your applications.
                </p>
              </div>

              {/* Tab buttons */}
              <div className="flex items-center gap-2 shrink-0 rounded-xl border border-[#1F1F23] bg-[#121215] p-1">
                <button
                  onClick={() => setActiveTab("projects")}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                    activeTab === "projects"
                      ? "bg-[#1F1F23] text-white"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <FolderOpen size={13} />
                  My Projects
                  {projects.length > 0 && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      activeTab === "projects" ? "bg-[#00AFEF]/20 text-[#00AFEF]" : "bg-white/5 text-gray-600"
                    }`}>
                      {projects.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("applications")}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                    activeTab === "applications"
                      ? "bg-[#1F1F23] text-white"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <Briefcase size={13} />
                  My Applications
                  {applications.length > 0 && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      activeTab === "applications" ? "bg-[#00AFEF]/20 text-[#00AFEF]" : "bg-white/5 text-gray-600"
                    }`}>
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
                    <Loader2 size={28} className="animate-spin text-[#00AFEF]" />
                  </div>
                ) : projects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-5 py-28 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-[#1F1F23] bg-[#0F0F11]">
                      <FolderOpen size={36} className="text-gray-700" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xl font-bold text-white">No projects yet</p>
                      <p className="text-sm text-gray-500 max-w-xs">
                        You haven't created any projects yet. Use the sidebar to start a new one.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                    <Loader2 size={28} className="animate-spin text-[#00AFEF]" />
                  </div>
                ) : applications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-5 py-28 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-[#1F1F23] bg-[#0F0F11]">
                      <Briefcase size={36} className="text-gray-700" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xl font-bold text-white">No applications yet</p>
                      <p className="text-sm text-gray-500 max-w-xs">
                        You haven't applied to any projects yet. Browse projects and apply for open positions.
                      </p>
                    </div>
                    <Link
                      href="/projects"
                      className="flex items-center gap-2 rounded-full border border-[#00AFEF]/20 bg-[#00AFEF]/5 px-5 py-2.5 text-sm font-semibold text-[#00AFEF] hover:bg-[#00AFEF]/10 transition-colors"
                    >
                      Browse Projects →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Summary stats */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 max-w-xs">
                      <div className="rounded-xl border border-[#1F1F23] bg-[#121215] px-4 py-3 text-center">
                        <p className="text-lg font-bold text-yellow-400">{pendingCount}</p>
                        <p className="text-[11px] text-gray-500">Pending</p>
                      </div>
                      <div className="rounded-xl border border-[#1F1F23] bg-[#121215] px-4 py-3 text-center">
                        <p className="text-lg font-bold text-emerald-400">{acceptedCount}</p>
                        <p className="text-[11px] text-gray-500">Accepted</p>
                      </div>
                    </div>

                    {/* Accepted first, then pending */}
                    {acceptedCount > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 px-1">
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
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-yellow-400 px-1">
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