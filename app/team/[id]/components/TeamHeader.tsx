
"use client";

import {
  Users,
  UserCheck,
  Shield,
  Activity,
  Inbox,
  MessageSquare,
} from "lucide-react";
import { Project, TeamMember } from "../types";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import CreateGroupChatModal from "@/app/messages/group-chat/components/CreateGroupChatModal";

type Props = {
  project: Project;
  members: TeamMember[];
  isFounder: boolean;
  onInvite: () => void;
};

export default function TeamHeader({
  project,
  members,
  isFounder,
  onInvite,
}: Props) {
  const activeCount = members.filter(
    (m) => m.status === "active"
  ).length;

  const roles = [...new Set(members.map((m) => m.role))].length;

  const [teamChatId, setTeamChatId] = useState<string | null>(null);
  const [createChatOpen, setCreateChatOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchTeamChat = async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("id")
        .eq("project_id", project.id)
        .eq("type", "team")
        .maybeSingle();

      if (error) {
        console.error("Failed to fetch team chat:", error);
        return;
      }

      if (isMounted) {
        setTeamChatId(data?.id ?? null);
      }
    };

    fetchTeamChat();

    return () => {
      isMounted = false;
    };
  }, [project.id]);

  const stats = [
    { icon: Users, label: "Members", value: members.length },
    { icon: UserCheck, label: "Active", value: activeCount },
    { icon: Shield, label: "Roles", value: roles },
    { icon: Activity, label: "Activity", value: "—" },
  ];

  return (
    <div className="space-y-5 rounded-2xl border border-border bg-surface px-6 py-5">
      {/* Project info */}
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface-secondary">
            {project.logo_url ? (
              <img
                src={project.logo_url}
                alt={project.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-lg font-black text-muted">
                {project.title.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">
              Team Members
            </p>

            <h1 className="truncate text-xl font-bold text-foreground">
              {project.title}
            </h1>

            <p className="mt-0.5 text-xs text-muted">
              Manage your project team and roles.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {/* Team Chat */}
          {teamChatId ? (
            <Link
              href={`/messages?group=${teamChatId}`}
              className="flex items-center gap-2 rounded-xl border border-[#00AFEF]/20 bg-[#00AFEF]/5 px-4 py-2.5 text-sm font-semibold text-[#00AFEF] transition-all hover:bg-[#00AFEF]/10 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00AFEF]"
            >
              <MessageSquare size={15} />
              Team Chat
            </Link>
          ) : isFounder ? (
            <button
              type="button"
              onClick={() => setCreateChatOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-border bg-surface-secondary px-4 py-2.5 text-sm font-semibold text-foreground transition-all hover:border-[#00AFEF]/40 hover:text-[#00AFEF] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00AFEF]"
            >
              <MessageSquare size={15} />
              Create Team Chat
            </button>
          ) : null}

          {/* Founder-only actions */}
          {isFounder && (
            <>
              <Link
                href={`/applications/${project.id}`}
                className="flex items-center gap-2 rounded-xl border border-[#00AFEF]/20 bg-[#00AFEF]/5 px-4 py-2.5 text-sm font-semibold text-[#00AFEF] transition-all hover:bg-[#00AFEF]/10 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00AFEF]"
              >
                <Inbox size={15} />
                View Applications
              </Link>

              <button
                type="button"
                onClick={onInvite}
                className="flex items-center gap-2 rounded-xl bg-[#00AFEF] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#00AFEF]/20 transition-all hover:bg-[#009bd4] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00AFEF] focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                + Invite Member
              </button>
            </>
          )}
        </div>

        {/* Create group chat modal */}
        <CreateGroupChatModal
          isOpen={createChatOpen}
          onClose={() => setCreateChatOpen(false)}
          projectId={project.id}
          projectTitle={project.title}
          projectLogo={project.logo_url || ""}
        />
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-surface-secondary px-4 py-3"
          >
            <stat.icon size={16} className="text-[#00AFEF]" />

            <p className="text-lg font-bold text-foreground">
              {stat.value}
            </p>

            <p className="text-[11px] text-muted">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
