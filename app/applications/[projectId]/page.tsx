"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Application, Project } from "../../../apply/[projectId]/types";
import ApplicationCard from "./components/ApplicationCard";
import { ArrowLeft, Loader2, InboxIcon } from "lucide-react";
import Link from "next/link";

type Tab = "pending" | "accepted" | "rejected" | "all";

export default function ApplicationsDashboard() {
  const params    = useParams();
  const router    = useRouter();
  const projectId = params?.projectId as string;

  const [project,      setProject]      = useState<Project | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [activeTab,    setActiveTab]    = useState<Tab>("pending");
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

    // Load project — only founder can access this page
    const { data: proj } = await supabase
      .from("projects")
      .select("id, title, description, logo_url, user_id, team_needs")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (!proj) { router.push("/projects"); return; }
    setProject(proj);

    // Load all applications for this project
    const { data: apps } = await supabase
      .from("project_applications")
      .select("*, project_positions(title)")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (!apps || apps.length === 0) {
      setApplications([]);
      setLoading(false);
      return;
    }

    // Fetch applicant profiles in one batch
    const applicantIds = [...new Set(apps.map((a: any) => a.applicant_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url")
      .in("user_id", applicantIds);

    const profileMap: Record<string, { full_name: string; avatar_url: string }> = {};
    profiles?.forEach((p: any) => { profileMap[p.user_id] = p; });

    const enriched: Application[] = apps.map((a: any) => ({
      ...a,
      skills:          Array.isArray(a.skills) ? a.skills : [],
      portfolio_links: Array.isArray(a.portfolio_links) ? a.portfolio_links : [],
      position_title:  a.project_positions?.title || "Unknown Position",
      applicant_name:  profileMap[a.applicant_id]?.full_name || a.full_name,
      applicant_avatar: profileMap[a.applicant_id]?.avatar_url || "",
    }));

    setApplications(enriched);
    setLoading(false);
  };

  const handleAccept = async (app: Application) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Update application status
    await supabase
      .from("project_applications")
      .update({ status: "accepted", reviewed_at: new Date().toISOString() })
      .eq("id", app.id);

    // 2. Add to team_members
    await supabase.from("team_members").upsert([{
      project_id: projectId,
      user_id:    app.applicant_id,
      role:       app.position_title || "Collaborator",
      status:     "active",
    }]);

    // 3. Fetch founder name for notification
    const { data: founderProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .single();

    const founderName = founderProfile?.full_name || "The project founder";

    // 4. Notify applicant
    await supabase.from("notifications").insert([{
      user_id:            app.applicant_id,
      title:              "Application Accepted! 🎉",
      message:            `${founderName} accepted your application for ${app.position_title} on ${project?.title}. Welcome to the team!`,
      type:               "application_accepted",
      related_project_id: projectId,
      sender_id:          user.id,
    }]);

    // 5. Update local state
    setApplications((prev) =>
      prev.map((a) => a.id === app.id ? { ...a, status: "accepted" } : a)
    );
  };

  const handleReject = async (app: Application) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Update application status
    await supabase
      .from("project_applications")
      .update({ status: "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", app.id);

    // 2. Fetch founder name
    const { data: founderProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .single();

    const founderName = founderProfile?.full_name || "The project founder";

    // 3. Notify applicant
    await supabase.from("notifications").insert([{
      user_id:            app.applicant_id,
      title:              "Application Update",
      message:            `${founderName} reviewed your application for ${app.position_title} on ${project?.title} and decided not to move forward at this time.`,
      type:               "application_rejected",
      related_project_id: projectId,
      sender_id:          user.id,
    }]);

    // 4. Update local state
    setApplications((prev) =>
      prev.map((a) => a.id === app.id ? { ...a, status: "rejected" } : a)
    );
  };

  const counts = useMemo(() => ({
    all:      applications.length,
    pending:  applications.filter((a) => a.status === "pending").length,
    accepted: applications.filter((a) => a.status === "accepted").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  }), [applications]);

  const displayed = useMemo(() =>
    activeTab === "all"
      ? applications
      : applications.filter((a) => a.status === activeTab),
    [applications, activeTab]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#00AFEF]" />
      </div>
    );
  }

  if (!project) return null;

  const TABS: { key: Tab; label: string }[] = [
    { key: "pending",  label: "Pending"  },
    { key: "accepted", label: "Accepted" },
    { key: "rejected", label: "Rejected" },
    { key: "all",      label: "All"      },
  ];

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
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-6">

        {/* Back */}
        <Link
          href="/my-projects"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={15} />
          My Projects
        </Link>

        {/* Header */}
        <div className="rounded-2xl border border-[#1F1F23] bg-[#0F0F11] px-6 py-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl border border-[#1F1F23] bg-[#121215] overflow-hidden flex items-center justify-center shrink-0">
                {project.logo_url ? (
                  <img src={project.logo_url} alt={project.title} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-lg font-black text-white/20">
                    {project.title.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#00AFEF]">
                  Applications
                </p>
                <h1 className="text-xl font-bold text-white">{project.title}</h1>
              </div>
            </div>

            <Link
              href={`/team/${projectId}`}
              className="rounded-full border border-[#1F1F23] bg-[#121215] px-4 py-2 text-xs text-gray-400 hover:text-white hover:border-white/10 transition-colors shrink-0"
            >
              View Team →
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Total",    value: counts.all      },
              { label: "Pending",  value: counts.pending  },
              { label: "Accepted", value: counts.accepted },
              { label: "Rejected", value: counts.rejected },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-[#1F1F23] bg-[#121215] px-4 py-3 text-center">
                <p className="text-lg font-bold text-white">{stat.value}</p>
                <p className="text-[11px] text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 rounded-xl border border-[#1F1F23] bg-[#121215] p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-[#1F1F23] text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {tab.label}
              {counts[tab.key] > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  activeTab === tab.key
                    ? "bg-[#00AFEF]/20 text-[#00AFEF]"
                    : "bg-white/5 text-gray-500"
                }`}>
                  {counts[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Applications list */}
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <InboxIcon size={40} className="text-gray-700" />
            <p className="text-lg font-semibold text-white">
              No {activeTab === "all" ? "" : activeTab} applications yet
            </p>
            <p className="text-sm text-gray-500">
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