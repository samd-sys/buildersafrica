
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Project,
  Position,
  normTeamNeeds,
  defaultPositionDescription,
} from "./types";
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

  // Sidebar hover listener
  useEffect(() => {
    const handleSidebarHover = (event: Event) => {
      const customEvent = event as CustomEvent;
      setIsSidebarHovered(customEvent.detail.isHovered);
    };

    window.addEventListener(
      "sidebarHover",
      handleSidebarHover as EventListener
    );

    return () => {
      window.removeEventListener(
        "sidebarHover",
        handleSidebarHover as EventListener
      );
    };
  }, []);

  // Load project and positions
  useEffect(() => {
    if (!projectId) return;

    let isMounted = true;

    const loadPage = async () => {
      setLoading(true);

      try {
        // Get authenticated user
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (!isMounted) return;

        if (authError || !user) {
          router.push("/login");
          return;
        }

        setCurrentUserId(user.id);

        // Load project
        const {
          data: proj,
          error: projError,
        } = await supabase
          .from("projects")
          .select("id, title, description, logo_url, user_id, team_needs")
          .eq("id", projectId)
          .single();

        if (!isMounted) return;

        if (projError || !proj) {
          router.push("/projects");
          return;
        }

        setProject(proj);

        // Load existing open positions
        const { data: existingPositions, error: positionsError } =
          await supabase
            .from("project_positions")
            .select("*")
            .eq("project_id", projectId)
            .eq("is_open", true)
            .order("created_at", { ascending: true });

        if (!isMounted) return;

        if (positionsError) {
          console.error("Error loading positions:", positionsError);
        }

        const existing: Position[] = existingPositions || [];

        // Normalize project team needs
        const teamNeeds = normTeamNeeds(proj.team_needs);

        const existingTitles = new Set(
          existing.map((position) => position.title.toLowerCase())
        );

        const missing = teamNeeds.filter(
          (role: string) => !existingTitles.has(role.toLowerCase())
        );

        // Automatically create missing positions for the founder
        if (missing.length > 0 && proj.user_id === user.id) {
          const toInsert = missing.map((role: string) => ({
            project_id: projectId,
            title: role,
            description: defaultPositionDescription(role, proj.title),
            is_open: true,
          }));

          const { data: inserted, error: insertError } = await supabase
            .from("project_positions")
            .insert(toInsert)
            .select("*");

          if (!isMounted) return;

          if (insertError) {
            console.error("Error generating positions:", insertError);
            setPositions(existing);
          } else {
            setPositions([
              ...existing,
              ...((inserted || []) as Position[]),
            ]);
          }
        } else {
          // Display synthesized positions for non-founders
          // when no database positions exist
          if (existing.length === 0 && teamNeeds.length > 0) {
            const synthesised: Position[] = teamNeeds.map(
              (role: string, index: number) => ({
                id: `temp-${index}`,
                project_id: projectId,
                title: role,
                description: defaultPositionDescription(role, proj.title),
                is_open: true,
                created_at: new Date().toISOString(),
              })
            );

            setPositions(synthesised);
          } else {
            setPositions(existing);
          }
        }

        // Load positions the current user has already applied for
        const { data: myApps, error: applicationsError } = await supabase
          .from("project_applications")
          .select("position_id")
          .eq("project_id", projectId)
          .eq("applicant_id", user.id);

        if (!isMounted) return;

        if (applicationsError) {
          console.error("Error loading applications:", applicationsError);
        }

        setAppliedPositionIds(
          (myApps || []).map(
            (application: { position_id: string }) =>
              application.position_id
          )
        );

        setLoading(false);
      } catch (error) {
        console.error("Error loading project positions:", error);

        if (isMounted) {
          setLoading(false);
          router.push("/projects");
        }
      }
    };

    loadPage();

    return () => {
      isMounted = false;
    };

    // Keep this dependency array consistent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const isFounder = project?.user_id === currentUserId;

  // Loading screen
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2
          size={28}
          className="animate-spin text-[#00AFEF]"
        />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div
      className={`min-h-screen bg-background text-foreground transition-all duration-500 ease-in-out ${
        isSidebarHovered ? "ml-16" : "ml-0"
      }`}
      style={{
        transform: isSidebarHovered ? "scale(1.005)" : "scale(1)",
        filter: isSidebarHovered ? "brightness(0.98)" : "brightness(1)",
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">

        {/* Back */}
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft size={15} />
          Back to Projects
        </Link>

        {/* Project header */}
        <div className="space-y-4 rounded-2xl border border-border bg-surface px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface-secondary">
              {project.logo_url ? (
                <img
                  src={project.logo_url}
                  alt={project.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xl font-black text-muted/40">
                  {project.title.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#00AFEF]">
                Open Positions
              </p>

              <h1 className="text-2xl font-bold text-foreground">
                {project.title}
              </h1>

              {project.description && (
                <p className="mt-1 line-clamp-2 text-sm text-muted">
                  {project.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className="rounded-full border border-border bg-surface-secondary px-3 py-1">
              {positions.length} open position
              {positions.length !== 1 ? "s" : ""}
            </span>

            {isFounder && (
              <Link
                href={`/applications/${projectId}`}
                className="rounded-full border border-[#00AFEF]/20 bg-[#00AFEF]/5 px-3 py-1 text-[#00AFEF] transition-colors hover:bg-[#00AFEF]/10"
              >
                View Applications →
              </Link>
            )}
          </div>
        </div>

        {/* Positions grid */}
        {positions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <FolderOpen size={40} className="text-muted/50" />

            <p className="text-lg font-semibold text-foreground">
              No open positions
            </p>

            <p className="text-sm text-muted">
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
