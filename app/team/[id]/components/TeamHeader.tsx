import { Users, UserCheck, Shield, Activity, Inbox, MessageSquare } from "lucide-react";
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

export default function TeamHeader({ project, members, isFounder, onInvite }: Props) {
  const activeCount = members.filter((m) => m.status === "active").length;
  const roles = [...new Set(members.map((m) => m.role))].length;
  const [teamChatId,      setTeamChatId]      = useState<string | null>(null);
  const [createChatOpen,  setCreateChatOpen]  = useState(false);

  useEffect(() => {
    supabase
      .from("conversations")
      .select("id")
      .eq("project_id", project.id)
      .eq("type", "team")
      .maybeSingle()
      .then(({ data }) => setTeamChatId(data?.id ?? null));
  }, [project.id]);

  return (
    <div className="rounded-2xl border border-[#1F1F23] bg-[#0F0F11] px-6 py-5 space-y-5">
      {/* Project info */}
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
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
              Team Members
            </p>
            <h1 className="text-xl font-bold text-white">{project.title}</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Manage your project team and roles.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Team Chat — visible to all once created, create only for founder */}
          {teamChatId ? (
            <Link
              href={`/messages?group=${teamChatId}`}
              className="flex items-center gap-2 rounded-xl border border-[#00AFEF]/20 bg-[#00AFEF]/5 px-4 py-2.5 text-sm font-semibold text-[#00AFEF] transition-all hover:bg-[#00AFEF]/10 active:scale-[0.98]"
            >
              <MessageSquare size={15} />
              Team Chat
            </Link>
          ) : isFounder ? (
            <button
              onClick={() => setCreateChatOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-[#1F1F23] bg-[#121215] px-4 py-2.5 text-sm font-semibold text-gray-300 hover:border-[#00AFEF]/30 hover:text-[#00AFEF] transition-all active:scale-[0.98]"
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
                className="flex items-center gap-2 rounded-xl border border-[#00AFEF]/20 bg-[#00AFEF]/5 px-4 py-2.5 text-sm font-semibold text-[#00AFEF] transition-all hover:bg-[#00AFEF]/10 active:scale-[0.98]"
              >
                <Inbox size={15} />
                View Applications
              </Link>
              <button
                onClick={onInvite}
                className="flex items-center gap-2 rounded-xl bg-[#00AFEF] px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-[#00AFEF]/20 transition-all hover:bg-[#00AFEF]/80 active:scale-[0.98]"
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
      <div className="grid grid-cols-4 gap-3">
        {[
          { icon: Users,     label: "Members",  value: members.length },
          { icon: UserCheck, label: "Active",   value: activeCount    },
          { icon: Shield,    label: "Roles",    value: roles          },
          { icon: Activity,  label: "Activity", value: "—"            },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-[#1F1F23] bg-[#121215] px-4 py-3"
          >
            <stat.icon size={16} className="text-[#00AFEF]" />
            <p className="text-lg font-bold text-white">{stat.value}</p>
            <p className="text-[11px] text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}