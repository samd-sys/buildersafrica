
"use client";

import { useEffect, useState } from "react";
import {
  User,
  MoreVertical,
  UserMinus,
  RefreshCw,
} from "lucide-react";
import { TeamMember } from "../types";

type Props = {
  member: TeamMember;
  isFounder: boolean;
  onViewProfile: (member: TeamMember) => void;
  onRemove: (member: TeamMember) => void;
  onChangeRole: (member: TeamMember) => void;
};

const ROLE_COLORS: Record<string, string> = {
  "Project Lead":
    "text-amber-500 bg-amber-500/10 border-amber-500/20",
  "Frontend Developer":
    "text-blue-500 bg-blue-500/10 border-blue-500/20",
  "Backend Developer":
    "text-purple-500 bg-purple-500/10 border-purple-500/20",
  "Full Stack Developer":
    "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
  "UI/UX Designer":
    "text-pink-500 bg-pink-500/10 border-pink-500/20",
  "AI Engineer":
    "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
  "Product Manager":
    "text-orange-500 bg-orange-500/10 border-orange-500/20",
  "QA Engineer":
    "text-red-500 bg-red-500/10 border-red-500/20",
  "DevOps Engineer":
    "text-teal-500 bg-teal-500/10 border-teal-500/20",
  "Data Scientist":
    "text-violet-500 bg-violet-500/10 border-violet-500/20",
  "Marketing Expert":
    "text-rose-500 bg-rose-500/10 border-rose-500/20",
  "Content Writer":
    "text-lime-600 bg-lime-500/10 border-lime-500/20",
  "Business Advisor":
    "text-yellow-600 bg-yellow-500/10 border-yellow-500/20",
  Collaborator:
    "text-gray-500 bg-gray-500/10 border-gray-500/20",
};

function getRoleColor(role: string) {
  return (
    ROLE_COLORS[role] ??
    "text-gray-500 bg-gray-500/10 border-gray-500/20"
  );
}

export default function MemberCard({
  member,
  isFounder,
  onViewProfile,
  onRemove,
  onChangeRole,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  // Close action menu when Escape is pressed.
  useEffect(() => {
    if (!menuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const isActive = member.status === "active";

  return (
    <div
      onClick={() => onViewProfile(member)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onViewProfile(member);
        }
      }}
      role="button"
      tabIndex={0}
      className="group flex cursor-pointer items-center gap-4 rounded-xl border border-border bg-surface px-4 py-3.5 transition-all hover:border-[#00AFEF]/40 hover:bg-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00AFEF]"
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-secondary">
          {member.avatar_url ? (
            <img
              src={member.avatar_url}
              alt={member.full_name || "Team member"}
              className="h-full w-full object-cover"
            />
          ) : (
            <User size={16} className="text-muted" />
          )}
        </div>

        {/* Status dot */}
        <span
          className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-surface ${
            isActive ? "bg-emerald-500" : "bg-gray-400 dark:bg-gray-600"
          }`}
          aria-label={isActive ? "Online" : "Offline"}
        />
      </div>

      {/* Member information */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {member.full_name || "Unnamed Builder"}
        </p>

        <p className="truncate text-xs text-muted">
          {member.professional_title || member.email || "—"}
        </p>
      </div>

      {/* Role badge */}
      <span
        className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold ${getRoleColor(
          member.role
        )}`}
      >
        {member.role}
      </span>

      {/* Status label */}
      <span
        className={`shrink-0 text-[11px] font-medium ${
          isActive ? "text-emerald-500" : "text-muted"
        }`}
      >
        {isActive ? "Online" : "Offline"}
      </span>

      {/* Action menu — founder only */}
      {isFounder && (
        <div
          className="relative shrink-0"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            aria-label={`Actions for ${member.full_name || "team member"}`}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00AFEF]"
          >
            <MoreVertical size={15} />
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-xl border border-border bg-surface shadow-xl"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onChangeRole(member);
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-xs text-muted transition-colors hover:bg-surface-secondary hover:text-foreground focus-visible:bg-surface-secondary focus-visible:outline-none"
              >
                <RefreshCw size={13} />
                Change Role
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onRemove(member);
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-xs text-red-500 transition-colors hover:bg-red-500/10 focus-visible:bg-red-500/10 focus-visible:outline-none"
              >
                <UserMinus size={13} />
                Remove from Team
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
