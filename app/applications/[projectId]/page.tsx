
"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Application, Project } from "@/app/apply/[projectId]/types";
import ApplicationCard from "./components/ApplicationCard";
import { ArrowLeft, Loader2, InboxIcon } from "lucide-react";
import Link from "next/link";

type Tab = "pending" | "accepted" | "rejected" | "all";

export default function ApplicationsDashboard() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("pending");
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

  // Load project and applications
  useEffect(() => {
    if (!projectId) return;

    let isMounted = true;

    const loadPage = async () => {
      setLoading(true);

      try {
        // Authenticate user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!isMounted) return;

        if (!user) {
          router.push("/login");
          return;
        }

        // Load project — only the founder can access this page
        const { data: proj, error: projectError } = await supabase
          .from("projects")
          .select("id, title, description, logo_url, user_id, team_needs")
          .eq("id", projectId)
          .eq("user_id", user.id)
          .single();

        if (!isMounted) return;

        if (projectError || !proj) {
          router.push("/projects");
          return;
        }

        setProject(proj);

        // Load all applications for this project
        const { data: apps, error: applicationsError } = await supabase
          .from("project_applications")
          .select("*, project_positions(title)")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false });

        if (!isMounted) return;

        if (applicationsError) {
          console.error("Error loading applications:", applicationsError);
        }

        if (!apps || apps.length === 0) {
          setApplications([]);
          setLoading(false);
          return;
        }

        // Fetch applicant profiles in one batch
        const applicantIds = [
          ...new Set(apps.map((application: any) => application.applicant_id)),
        ];

        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", applicantIds);

        if (!isMounted) return;

        if (profilesError) {
          console.error("Error loading applicant profiles:", profilesError);
        }

        const profileMap: Record<
          string,
          { full_name: string; avatar_url: string }
        > = {};

        profiles?.forEach((profile: any) => {
          profileMap[profile.user_id] = profile;
        });

        // Enrich applications with applicant information
        const enriched: Application[] = apps.map((application: any) => ({
          ...application,
          skills: Array.isArray(application.skills)
            ? application.skills
            : [],
          portfolio_links: Array.isArray(application.portfolio_links)
            ? application.portfolio_links
            : [],
          position_title:
            application.project_positions?.title || "Unknown Position",
          applicant_name:
            profileMap[application.applicant_id]?.full_name ||
            application.full_name,
          applicant_avatar:
            profileMap[application.applicant_id]?.avatar_url || "",
        }));

        setApplications(enriched);
        setLoading(false);
      } catch (error) {
        console.error("Error loading applications dashboard:", error);

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

    // Keep the dependency array stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Accept application
  const handleAccept = async (app: Application) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // 1. Update application status
    const { error: updateError } = await supabase
      .from("project_applications")
      .update({
        status: "accepted",
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", app.id)
      .eq("project_id", projectId);

    if (updateError) {
      console.error("Error accepting application:", updateError);
      return;
    }

    // 2. Add applicant to team members
    const { error: teamError } = await supabase
      .from("team_members")
      .upsert(
        [
          {
            project_id: projectId,
            user_id: app.applicant_id,
            role: app.position_title || "Collaborator",
            status: "active",
          },
        ],
        { onConflict: "project_id,user_id" }
      );

    if (teamError) {
      console.error("Error adding team member:", teamError);
    }

    // 3. Fetch founder name
    const { data: founderProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .single();

    const founderName =
      founderProfile?.full_name || "The project founder";

    // 4. Notify applicant
    const { error: notificationError } = await supabase
      .from("notifications")
      .insert([
        {
          user_id: app.applicant_id,
          title: "Application Accepted! 🎉",
          message: `${founderName} accepted your application for ${app.position_title} on ${project?.title}. Welcome to the team!`,
          type: "application_accepted",
          related_project_id: projectId,
          sender_id: user.id,
        },
      ]);

    if (notificationError) {
      console.error("Error sending acceptance notification:", notificationError);
    }

    // 5. Update local state
    setApplications((prev) =>
      prev.map((application) =>
        application.id === app.id
          ? { ...application, status: "accepted" }
          : application
      )
    );
  };

  // Reject application
  const handleReject = async (app: Application) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // 1. Update application status
    const { error: updateError } = await supabase
      .from("project_applications")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", app.id)
      .eq("project_id", projectId);

    if (updateError) {
      console.error("Error rejecting application:", updateError);
      return;
    }

    // 2. Fetch founder name
    const { data: founderProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .single();

    const founderName =
      founderProfile?.full_name || "The project founder";

    // 3. Notify applicant
    const { error: notificationError } = await supabase
      .from("notifications")
      .insert([
        {
          user_id: app.applicant_id,
          title: "Application Update",
          message: `${founderName} reviewed your application for ${app.position_title} on ${project?.title} and decided not to move forward at this time.`,
          type: "application_rejected",
          related_project_id: projectId,
          sender_id: user.id,
        },
      ]);

    if (notificationError) {
      console.error("Error sending rejection notification:", notificationError);
    }

    // 4. Update local state
    setApplications((prev) =>
      prev.map((application) =>
        application.id === app.id
          ? { ...application, status: "rejected" }
          : application
      )
    );
  };

  // Application counts
  const counts = useMemo(
    () => ({
      all: applications.length,
      pending: applications.filter((a) => a.status === "pending").length,
      accepted: applications.filter((a) => a.status === "accepted").length,
      rejected: applications.filter((a) => a.status === "rejected").length,
    }),
    [applications]
  );

  // Filter applications by active tab
  const displayed = useMemo(
    () =>
      activeTab === "all"
        ? applications
        : applications.filter((a) => a.status === activeTab),
    [applications, activeTab]
  );

  const TABS: { key: Tab; label: string }[] = [
    { key: "pending", label: "Pending" },
    { key: "accepted", label: "Accepted" },
    { key: "rejected", label: "Rejected" },
    { key: "all", label: "All" },
  ];

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
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">

        {/* Back */}
        <Link
          href="/my-projects"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft size={15} />
          My Projects
        </Link>

        {/* Header */}
        <div className="space-y-4 rounded-2xl border border-border bg-surface px-6 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface-secondary">
                {project.logo_url ? (
                  <img
                    src={project.logo_url}
                    alt={project.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-black text-muted/40">
                    {project.title.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#00AFEF]">
                  Applications
                </p>

                <h1 className="truncate text-xl font-bold text-foreground">
                  {project.title}
                </h1>
              </div>
            </div>

            <Link
              href={`/team/${projectId}`}
              className="shrink-0 rounded-full border border-border bg-surface-secondary px-4 py-2 text-xs text-muted transition-colors hover:border-[#00AFEF]/30 hover:text-[#00AFEF]"
            >
              View Team →
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total", value: counts.all },
              { label: "Pending", value: counts.pending },
              { label: "Accepted", value: counts.accepted },
              { label: "Rejected", value: counts.rejected },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border bg-surface-secondary px-4 py-3 text-center"
              >
                <p className="text-lg font-bold text-foreground">
                  {stat.value}
                </p>
                <p className="text-[11px] text-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-2 py-2 text-xs font-medium transition-all sm:px-3 ${
                activeTab === tab.key
                  ? "bg-surface-secondary text-foreground"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {tab.label}

              {counts[tab.key] > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    activeTab === tab.key
                      ? "bg-[#00AFEF]/15 text-[#00AFEF]"
                      : "bg-surface-secondary text-muted"
                  }`}
                >
                  {counts[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Applications list */}
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <InboxIcon size={40} className="text-muted/50" />

            <p className="text-lg font-semibold text-foreground">
              No {activeTab === "all" ? "" : activeTab} applications yet
            </p>

            <p className="text-sm text-muted">
              {activeTab === "pending"
                ? "New applications will appear here when builders apply to your project."
                : `No applications have been ${activeTab} yet.`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map((app) => (
              <ApplicationCard
                key={app.id}
                application={app}
                onAccept={handleAccept}
                onReject={handleReject}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
