"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Project, Position, normTeamNeeds, defaultPositionDescription } from "./types";
import PositionCard from "./components/PositionCard";
import { ArrowLeft, Loader2, FolderOpen } from "lucide-react";
import Link from "next/link";

export default function ApplyProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [appliedPositionIds, setAppliedPositionIds] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  useEffect(() => {
    const handleSidebarHover = (event: CustomEvent) => {
      setIsSidebarHovered(event.detail.isHovered);
    };
    window.addEventListener("sidebarHover", handleSidebarHover as EventListener);
    return () =>
      window.removeEventListener("sidebarHover", handleSidebarHover as EventListener);
  }, []);

  useEffect(() => {
    if (projectId) loadPage();
  }, [projectId]);

  const loadPage = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    setCurrentUserId(user.id);

    // Load project
    const { data: proj, error: projError } = await supabase
      .from("projects")
      .select("id, title, description, logo_url, user_id, team_needs")
      .eq("id", projectId)
      .single();

    if (projError || !proj) { router.push("/projects"); return; }
    setProject(proj);

    // Load existing positions
    const { data: existingPositions } = await supabase
      .from("project_positions")
      .select("*")
      .eq("project_id", projectId)
      .eq("is_open", true)
      .order("created_at", { ascending: true });

    const existing = existingPositions || [];

    // Option C: auto-populate missing positions from team_needs
    const teamNeeds = normTeamNeeds(proj.team_needs);
    const existingTitles = new Set(existing.map((p: Position) => p.title.toLowerCase()));
    const missing = teamNeeds.filter(
      (role: string) => !existingTitles.has(role.toLowerCase())
    );

    if (missing.length > 0 && proj.user_id === user.id) {
      // Only the founder's session inserts auto-generated positions
      // (RLS guarantees this — non-founders can't insert)
      const toInsert = missing.map((role: string) => ({
        project_id: projectId,
        title: role,
        description: defaultPositionDescription(role, proj.title),
        is_open: true,
      }));

      const { data: inserted } = await supabase
        .from("project_positions")
        .insert(toInsert)
        .select("*");

      if (inserted) {
        setPositions([...existing, ...inserted]);
      } else {
        setPositions(existing);
      }
    } else {
      // For non-founders, just show existing open positions
      // If there are none yet, show team_needs as read-only cards
      if (existing.length === 0 && teamNeeds.length > 0) {
        // Synthesise display-only position objects from team_needs
        const synthesised: Position[] = teamNeeds.map((role: string, i: number) => ({
          id: `temp-${i}`,
          project_id: projectId,
          title: role,
          description: defaultPositionDescription(role, proj.title),
          is_open: true,
          created_at: new Date().toISOString(),
        }));
        setPositions(synthesised);
      } else {
        setPositions(existing);
      }
    }

    // Load which positions the current user has already applied for
    const { data: myApps } = await supabase
      .from("project_applications")
      .select("position_id")
      .eq("project_id", projectId)
      .eq("applicant_id", user.id);

    setAppliedPositionIds((myApps || []).map((a: { position_id: string }) => a.position_id));
    setLoading(false);
  };

  const isFounder = project?.user_id === currentUserId;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#00AFEF]" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div
      className={`min-h-screen bg-[#09090B] text-white transition-all duration-500 ease-in-out ${
        isSidebarHovered ? "ml-16" : "ml-0"
      }`}
      style={{
        transform: isSidebarHovered ? "scale(1.005)" : "scale(1)",
        filter: isSidebarHovered ? "brightness(0.98)" : "brightness(1)",
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">

        {/* Back */}
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={15} />
          Back to Projects
        </Link>

        {/* Project header */}
        <div className="rounded-2xl border border-[#1F1F23] bg-[#0F0F11] px-6 py-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl border border-[#1F1F23] bg-[#121215] overflow-hidden flex items-center justify-center shrink-0">
              {project.logo_url ? (
                <img
                  src={project.logo_url}
                  alt={project.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xl font-black text-white/20">
                  {project.title.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#00AFEF]">
                Open Positions
              </p>
              <h1 className="text-2xl font-bold text-white">{project.title}</h1>
              {project.description && (
                <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                  {project.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="rounded-full border border-[#1F1F23] bg-[#121215] px-3 py-1">
              {positions.length} open position{positions.length !== 1 ? "s" : ""}
            </span>
            {isFounder && (
              <Link
                href={`/applications/${projectId}`}
                className="rounded-full border border-[#00AFEF]/20 bg-[#00AFEF]/5 px-3 py-1 text-[#00AFEF] hover:bg-[#00AFEF]/10 transition-colors"
              >
                View Applications →
              </Link>
            )}
          </div>
        </div>

        {/* Positions grid */}
        {positions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <FolderOpen size={40} className="text-gray-700" />
            <p className="text-lg font-semibold text-white">No open positions</p>
            <p className="text-sm text-gray-500">
              This project has no open positions at the moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {positions.map((position) => (
              <PositionCard
                key={position.id}
                position={position}
                projectId={projectId}
                isFounder={isFounder}
                hasApplied={appliedPositionIds.includes(position.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}