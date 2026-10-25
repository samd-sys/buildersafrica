"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { TeamMember, Project } from "./types";
import TeamHeader from "./components/TeamHeader";
import MemberList from "./components/MemberList";
import MemberProfilePanel from "./components/MemberProfilePanel";
import InviteModal from "./components/InviteModal";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TeamPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  useEffect(() => {
    const handleSidebarHover = (event: CustomEvent) => {
      setIsSidebarHovered(event.detail.isHovered);
    };
    window.addEventListener("sidebarHover", handleSidebarHover as EventListener);
    return () =>
      window.removeEventListener("sidebarHover", handleSidebarHover as EventListener);
  }, []);

  const loadPage = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    setCurrentUserId(user.id);

    // Load project
    const { data: proj, error: projError } = await supabase
      .from("projects")
      .select("id, title, description, logo_url, user_id")
      .eq("id", projectId)
      .single();

    if (projError || !proj) { router.push("/projects"); return; }
    setProject(proj);

    const isFounder = proj.user_id === user.id;

    // Check access: must be founder or team member
    if (!isFounder) {
      const { data: membership } = await supabase
        .from("team_members")
        .select("id")
        .eq("project_id", projectId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!membership) { router.push("/projects"); return; }
    }

    // Load team members + their profiles
    const { data: teamData } = await supabase
      .from("team_members")
      .select("*")
      .eq("project_id", projectId)
      .order("joined_at", { ascending: true });

    if (!teamData || teamData.length === 0) {
      setMembers([]);
      setLoading(false);
      return;
    }

    const userIds = teamData.map((m: any) => m.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url, professional_title, country, bio, skills, github_url, linkedin_url, website_url")
      .in("user_id", userIds);

    // Fetch emails from auth (only available for founder via service role in prod,
    // here we just use what's in profiles)
    const profileMap: Record<string, any> = {};
    profiles?.forEach((p: any) => { profileMap[p.user_id] = p; });

    const enriched: TeamMember[] = teamData.map((m: any) => {
      const p = profileMap[m.user_id] ?? {};
      return {
        id: m.id,
        user_id: m.user_id,
        project_id: m.project_id,
        role: m.role || "Collaborator",
        status: m.status || "active",
        joined_at: m.joined_at,
        full_name: p.full_name || "Unnamed Builder",
        avatar_url: p.avatar_url || "",
        professional_title: p.professional_title || "",
        country: p.country || "",
        bio: p.bio || "",
        skills: Array.isArray(p.skills)
          ? p.skills
          : typeof p.skills === "string"
          ? p.skills.split(",").map((s: string) => s.trim()).filter(Boolean)
          : [],
        github_url: p.github_url || "",
        linkedin_url: p.linkedin_url || "",
        website_url: p.website_url || "",
        email: "",
      };
    });

    setMembers(enriched);
    setLoading(false);
  };

  useEffect(() => {
    if (projectId) loadPage();
  }, [projectId]);

  const isFounder = project?.user_id === currentUserId;

  const handleRemoveMember = async (member: TeamMember) => {
    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("id", member.id);

    if (error) { alert(error.message); return; }
    setMembers((prev) => prev.filter((m) => m.id !== member.id));

    // Notify the removed member
    const { data: founderProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", currentUserId)
      .single();

    await supabase.from("notifications").insert([{
      user_id: member.user_id,
      title: "Removed from Project",
      message: `${founderProfile?.full_name || "The founder"} has removed you from the project: ${project?.title}.`,
      type: "member_removed",
      related_project_id: projectId,
      sender_id: currentUserId,
    }]);
  };

  const handleChangeRole = async (member: TeamMember, newRole: string) => {
    const { error } = await supabase
      .from("team_members")
      .update({ role: newRole })
      .eq("id", member.id);

    if (error) { alert(error.message); return; }

    setMembers((prev) =>
      prev.map((m) => (m.id === member.id ? { ...m, role: newRole } : m))
    );
    setSelectedMember((prev) =>
      prev?.id === member.id ? { ...prev, role: newRole } : prev
    );

    // Notify the member
    await supabase.from("notifications").insert([{
      user_id: member.user_id,
      title: "Role Updated",
      message: `Your role in ${project?.title} has been updated to ${newRole}.`,
      type: "role_changed",
      related_project_id: projectId,
      sender_id: currentUserId,
    }]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-[#00AFEF]" />
          <p className="text-sm text-gray-400">Loading team...</p>
        </div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div
      className={`mt-6 h-160 rounded-3xl border border-white/20 bg-[#0F0F11] text-white transition-all duration-500 ease-in-out ${
        isSidebarHovered ? "ml-16" : "ml-0"
      }`}
      style={{
        transform: isSidebarHovered ? "scale(1.005)" : "scale(1)",
        filter: isSidebarHovered ? "brightness(0.98)" : "brightness(1)",
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-6">
        {/* Back link */}
        <Link
          href="/my-projects"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={15} />
          My Projects
        </Link>

        {/* Header */}
        <TeamHeader
          project={project}
          members={members}
          isFounder={isFounder}
          onInvite={() => setInviteOpen(true)}
        />

        {/* Member list */}
        <MemberList
          members={members}
          isFounder={isFounder}
          onViewProfile={setSelectedMember}
          onRemove={handleRemoveMember}
          onChangeRole={(member) => setSelectedMember(member)}
        />
      </div>

      {/* Member profile panel */}
      <MemberProfilePanel
        member={selectedMember}
        isFounder={isFounder}
        onClose={() => setSelectedMember(null)}
        onRemove={handleRemoveMember}
        onChangeRole={handleChangeRole}
      />

      {/* Invite modal */}
      <InviteModal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        projectId={projectId}
        projectTitle={project.title}
        existingMemberIds={[...members.map((m) => m.user_id), currentUserId]}
      />
    </div>
  );
}