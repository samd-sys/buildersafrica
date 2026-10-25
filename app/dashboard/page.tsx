"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const [projects, setprojects] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  // Listen for sidebar hover events
  useEffect(() => {
    const handleSidebarHover = (event: CustomEvent) => {
      setIsSidebarHovered(event.detail.isHovered);
    };

    window.addEventListener("sidebarHover", handleSidebarHover as EventListener);
    return () => {
      window.removeEventListener(
        "sidebarHover",
        handleSidebarHover as EventListener
      );
    };
  }, []);

  const loadDashboard = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // get founder projects
    const { data: projectsData } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.id);

    setprojects(projectsData || []);

    if (!projectsData || projectsData.length === 0) return;

    const ideaIds = projectsData.map((i) => i.id);

    // get applications for founder projects
    const { data: appData } = await supabase
      .from("applications")
      .select("*")
      .in("idea_id", ideaIds);

    setApplications(appData || []);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <div
      className={`
        p-10 
        transition-all duration-500 ease-in-out
        ${isSidebarHovered ? "ml-16" : "ml-0"}
      `}
      style={{
        transform: isSidebarHovered ? "scale(1.005)" : "scale(1)",
        filter: isSidebarHovered ? "brightness(0.98)" : "brightness(1)",
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <h1 className="text-3xl font-bold mb-6">Founder Dashboard</h1>

      <h2 className="text-xl font-bold mb-4">Your Startups</h2>

      {projects.map((idea: any) => (
        <div key={idea.id} className="border p-4 mb-4">
          <h3 className="font-bold">{idea.title}</h3>
          <p>{idea.description}</p>
        </div>
      ))}

      <h2 className="text-xl font-bold mt-8 mb-4">Applications</h2>

      {applications.map((app: any) => (
        <div key={app.id} className="border p-4 mb-3">
          <p>Application Message:</p>
          <p>{app.message}</p>
          <p className="text-sm text-gray-500">Status: {app.status}</p>
        </div>
      ))}
    </div>
  );
}