
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
  const [selectedMember, setSelectedMember] =
    useState<TeamMember | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  // Sidebar hover listener
  useEffect(() => {
    const handleSidebarHover = (event: Event) => {
      const customEvent = event as CustomEvent;

      setIsSidebarHovered(
        customEvent.detail.isHovered
      );
    };

    window.addEventListener(
      "sidebarHover",
      handleSidebarHover
    );

    return () => {
      window.removeEventListener(
        "sidebarHover",
        handleSidebarHover
      );
    };
  }, []);

  // Load project and team data
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

        if (authError || !user) {
          router.push("/login");
          return;
        }

        if (!isMounted) return;

        setCurrentUserId(user.id);

        // Load project
        const { data: proj, error: projError } =
          await supabase
            .from("projects")
            .select(
              "id, title, description, logo_url, user_id"
            )
            .eq("id", projectId)
            .single();

        if (projError || !proj) {
          router.push("/projects");
          return;
        }

        if (!isMounted) return;

        setProject(proj);

        const founder = proj.user_id === user.id;

        // Check access: founder or team member
        if (!founder) {
          const {
            data: membership,
            error: membershipError,
          } = await supabase
            .from("team_members")
            .select("id")
            .eq("project_id", projectId)
            .eq("user_id", user.id)
            .maybeSingle();

          if (membershipError || !membership) {
            router.push("/projects");
            return;
          }
        }

        if (!isMounted) return;

        // Load team members
        const { data: teamData, error: teamError } =
          await supabase
            .from("team_members")
            .select("*")
            .eq("project_id", projectId)
            .order("joined_at", { ascending: true });

        if (teamError) {
          console.error(
            "Failed to load team members:",
            teamError
          );

          setMembers([]);
          return;
        }

        if (!isMounted) return;

        if (!teamData || teamData.length === 0) {
          setMembers([]);
          return;
        }

        // Load member profiles
        const userIds = teamData.map(
          (member) => member.user_id
        );

        const {
          data: profiles,
          error: profilesError,
        } = await supabase
          .from("profiles")
          .select(
            "user_id, full_name, avatar_url, professional_title, country, bio, skills, github_url, linkedin_url, website_url"
          )
          .in("user_id", userIds);

        if (profilesError) {
          console.error(
            "Failed to load member profiles:",
            profilesError
          );
        }

        if (!isMounted) return;

        // Create profile lookup
        const profileMap: Record<string, any> = {};

        profiles?.forEach((profile) => {
          profileMap[profile.user_id] = profile;
        });

        // Combine team members with their profiles
        const enriched: TeamMember[] = teamData.map(
          (member) => {
            const profile =
              profileMap[member.user_id] ?? {};

            return {
              id: member.id,
              user_id: member.user_id,
              project_id: member.project_id,
              role: member.role || "Collaborator",
              status: member.status || "active",
              joined_at: member.joined_at,

              full_name:
                profile.full_name || "Unnamed Builder",

              avatar_url: profile.avatar_url || "",

              professional_title:
                profile.professional_title || "",

              country: profile.country || "",
              bio: profile.bio || "",

              skills: Array.isArray(profile.skills)
                ? profile.skills
                : typeof profile.skills === "string"
                ? profile.skills
                    .split(",")
                    .map((skill: string) => skill.trim())
                    .filter(Boolean)
                : [],

              github_url: profile.github_url || "",
              linkedin_url: profile.linkedin_url || "",
              website_url: profile.website_url || "",
              email: "",
            };
          }
        );

        setMembers(enriched);
      } catch (error) {
        console.error(
          "Failed to load team page:",
          error
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadPage();

    return () => {
      isMounted = false;
    };

    // projectId is the only value that triggers a reload.
    // Keep this dependency array fixed.
  }, [projectId]);

  const isFounder =
    project?.user_id === currentUserId;

  // Remove team member
  const handleRemoveMember = async (
    member: TeamMember
  ) => {
    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("id", member.id);

    if (error) {
      alert(error.message);
      return;
    }

    setMembers((prev) =>
      prev.filter((m) => m.id !== member.id)
    );

    setSelectedMember((prev) =>
      prev?.id === member.id ? null : prev
    );

    // Notify removed member
    const { data: founderProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", currentUserId)
      .single();

    const { error: notificationError } =
      await supabase
        .from("notifications")
        .insert([
          {
            user_id: member.user_id,
            title: "Removed from Project",
            message: `${
              founderProfile?.full_name ||
              "The founder"
            } has removed you from the project: ${
              project?.title
            }.`,
            type: "member_removed",
            related_project_id: projectId,
            sender_id: currentUserId,
          },
        ]);

    if (notificationError) {
      console.error(
        "Failed to send removal notification:",
        notificationError
      );
    }
  };

  // Change member role
  const handleChangeRole = async (
    member: TeamMember,
    newRole: string
  ) => {
    const { error } = await supabase
      .from("team_members")
      .update({ role: newRole })
      .eq("id", member.id);

    if (error) {
      throw error;
    }

    setMembers((prev) =>
      prev.map((m) =>
        m.id === member.id
          ? { ...m, role: newRole }
          : m
      )
    );

    setSelectedMember((prev) =>
      prev?.id === member.id
        ? { ...prev, role: newRole }
        : prev
    );

    // Notify member
    const { error: notificationError } =
      await supabase
        .from("notifications")
        .insert([
          {
            user_id: member.user_id,
            title: "Role Updated",
            message: `Your role in ${project?.title} has been updated to ${newRole}.`,
            type: "role_changed",
            related_project_id: projectId,
            sender_id: currentUserId,
          },
        ]);

    if (notificationError) {
      console.error(
        "Failed to send role update notification:",
        notificationError
      );
    }
  };

  // Loading screen
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2
            size={28}
            className="animate-spin text-[#00AFEF]"
          />

          <p className="text-sm text-muted">
            Loading team...
          </p>
        </div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div
      className={`mt-6 min-h-[calc(100vh-2rem)] rounded-3xl border border-border bg-background text-foreground transition-all duration-500 ease-in-out ${
        isSidebarHovered ? "ml-16" : "ml-0"
      }`}
      style={{
        transform: isSidebarHovered
          ? "scale(1.005)"
          : "scale(1)",

        filter: isSidebarHovered
          ? "brightness(0.98)"
          : "brightness(1)",

        transition:
          "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
        {/* Back link */}
        <Link
          href="/my-projects"
          className="inline-flex items-center gap-1.5 rounded-md text-sm text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00AFEF]"
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
          onChangeRole={(member) =>
            setSelectedMember(member)
          }
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
        existingMemberIds={[
          ...members.map((m) => m.user_id),
          currentUserId,
        ]}
      />
    </div>
  );
}
