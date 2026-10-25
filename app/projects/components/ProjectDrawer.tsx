import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Heart,
  Users,
  Star,
  Eye,
  MapPin,
  CalendarDays,
  User,
  ArrowRight,
} from "lucide-react";
import { Project, STAGE_META } from "../types";
import { useRouter } from "next/navigation";

type Props = {
  project: Project | null;
  onClose: () => void;
};

export default function ProjectDrawer({ project, onClose }: Props) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [teamMembers, setTeamMembers] = useState<{ user_id: string; role: string; full_name: string; avatar_url: string }[]>([]);

  const isOpen = !!project;

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (!project) return;
    loadTeamMembers();
  }, [project?.id]);

  const loadTeamMembers = async () => {
    if (!project) return;
    const { supabase } = await import("@/lib/supabase");
    const { data } = await supabase
      .from("team_members")
      .select("user_id, role")
      .eq("project_id", project.id);

    if (!data || data.length === 0) { setTeamMembers([]); return; }

    const userIds = data.map((m: any) => m.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url")
      .in("user_id", userIds);

    const profileMap: Record<string, { full_name: string; avatar_url: string }> = {};
    profiles?.forEach((p: any) => { profileMap[p.user_id] = p; });

    setTeamMembers(data.map((m: any) => ({
      user_id: m.user_id,
      role: m.role || "Collaborator",
      full_name: profileMap[m.user_id]?.full_name || "Builder",
      avatar_url: profileMap[m.user_id]?.avatar_url || "",
    })));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  const stage = project ? (STAGE_META[project.stage] ?? null) : null;

  if (!isMounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[540px] flex-col border-l border-[#1F1F23] bg-[#0C0C0E] shadow-2xl transition-all duration-300 ease-in-out ${
          isOpen
            ? "translate-x-0 opacity-100 visible"
            : "translate-x-full opacity-0 invisible pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#1F1F23] px-6 py-4">
          <span className="text-sm font-medium text-gray-400">
            Project Details
          </span>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable content */}
        {project && (
          <div className="flex-1 overflow-y-auto">
            {/* Banner */}
            <div className={`relative h-48 bg-gradient-to-br overflow-hidden`}>
              {project.logo_url ? (
                <img
                  src={project.logo_url}
                  alt={project.title}
                  className="h-full w-full object-cover opacity-70"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-7xl font-black text-white/10 select-none">
                    {project.title.slice(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            <div className="px-6 py-6 space-y-6">
              {/* Title + meta */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-2xl font-bold text-white leading-tight">
                    {project.title}
                  </h2>
                  {stage && (
                    <span className="shrink-0 flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold">
                      <span className="text-[#00AFEF]/30">stage:</span> {stage.label}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  {project.location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {project.location}
                    </span>
                  )}
                  {project.created_at && (
                    <span className="flex items-center gap-1">
                      <CalendarDays size={12} />
                      {formatDate(project.created_at)}
                    </span>
                  )}
                  {project.category && (
                    <span className="rounded-full border border-[#1F1F23] bg-[#121215] px-2.5 py-0.5">
                      {project.category}
                    </span>
                  )}
                </div>

                {/* Engagement metrics */}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <Heart size={14} className="text-rose-400" />
                    {project.likes}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users size={14} className="text-blue-400" />
                    {project.followers}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Star size={14} className="text-yellow-400" />
                    {project.rating.toFixed(1)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Eye size={14} className="text-purple-400" />
                    0
                  </span>
                </div>
              </div>

              {/* Founder */}
              <div className="flex items-center gap-3 rounded-xl border border-[#1F1F23] bg-[#121215] p-4">
                <div className="h-10 w-10 rounded-full overflow-hidden border border-[#27272A] bg-[#18181B] flex items-center justify-center shrink-0">
                  {project.founderAvatar ? (
                    <img
                      src={project.founderAvatar}
                      alt={project.founderName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User size={16} className="text-gray-600" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500">Project Founder</p>
                  <p className="text-sm font-semibold text-white">
                    {project.founderName}
                  </p>
                </div>
              </div>

              {/* Description */}
              {project.description && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    About
                  </h4>
                  <div className="rounded-xl border border-[#1F1F23] bg-[#121215] p-4">
                    <p className="text-sm leading-relaxed text-gray-300">
                      {project.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Problem statement */}
              {project.problem_statement && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Problem Being Solved
                  </h4>
                  <div className="rounded-xl border border-[#1F1F23] bg-[#121215] p-4">
                    <p className="text-sm leading-relaxed text-gray-300">
                      {project.problem_statement}
                    </p>
                  </div>
                </div>
              )}

              {/* Tech stack */}
              {project.tech_stack && project.tech_stack.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Technologies Used
                  </h4>
                  <div className="rounded-xl border border-[#1F1F23] bg-[#121215] p-4">
                    <div className="flex flex-wrap gap-2">
                      {project.tech_stack.map((tech) => (
                        <span
                          key={tech}
                          className="rounded-lg border border-white/30 bg-[#00AFEF]/1 px-3 py-1.5 text-xs font-medium text-white"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Target audience */}
              {project.target_audience && project.target_audience.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Target Audience
                  </h4>
                  <div className="rounded-xl border border-[#1F1F23] bg-[#121215] p-4">
                    <div className="flex flex-wrap gap-2">
                      {project.target_audience.map((a) => (
                        <span
                          key={a}
                          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-gray-300"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Vision */}
              {project.vision && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Long-term Vision
                  </h4>
                  <div className="rounded-xl border border-[#1F1F23] bg-[#121215] p-4">
                    <p className="text-sm leading-relaxed text-gray-300 italic">
                      "{project.vision}"
                    </p>
                  </div>
                </div>
              )}

              {/* Team Members */}
              {teamMembers.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Team Members
                  </h4>
                  <div className="rounded-xl border border-[#1F1F23] bg-[#121215] p-4 space-y-3">
                    {teamMembers.map((member) => (
                      <div key={member.user_id} className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full overflow-hidden border border-[#27272A] bg-[#18181B] flex items-center justify-center shrink-0">
                          {member.avatar_url ? (
                            <img src={member.avatar_url} alt={member.full_name} className="h-full w-full object-cover" />
                          ) : (
                            <User size={14} className="text-gray-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white">{member.full_name}</p>
                          <p className="text-[11px] text-gray-500">{member.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Team needs + Apply */}
              {project.team_needs && project.team_needs.length > 0 && (
                <div className="space-y-3">
                  <div className="rounded-xl border border-white/30 bg-[#00AFEF]/1 p-5 space-y-4">
                    <div>
                      <h4 className="text-lg font-semibold text-white">
                        Open positions
                      </h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        This project is actively looking for team members.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {project.team_needs.map((role) => (
                        <span
                          key={role}
                          className="rounded-lg border border-white/30 bg-[#00AFEF]/2 px-3 py-1.5 text-xs font-medium text-white"
                        >
                          {role}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        onClose();
                        router.push(`/apply/${project!.id}`);
                      }}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#00AFEF] py-3 text-sm font-semibold text-slate-950 hover:bg-[#00AFEF]/80 active:scale-[0.98] transition-all"
                    >
                      <ArrowRight size={14} />
                      View Open Positions & Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>,
    document.body
  );
}