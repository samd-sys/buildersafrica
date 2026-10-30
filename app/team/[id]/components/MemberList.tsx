
"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { TeamMember } from "../types";
import MemberCard from "./MemberCard";

type Props = {
  members: TeamMember[];
  isFounder: boolean;
  onViewProfile: (member: TeamMember) => void;
  onRemove: (member: TeamMember) => void;
  onChangeRole: (member: TeamMember) => void;
};

export default function MemberList({
  members,
  isFounder,
  onViewProfile,
  onRemove,
  onChangeRole,
}: Props) {
  const [search, setSearch] = useState("");

  const normalizedSearch = search.trim().toLowerCase();

  const filtered = members.filter(
    (member) =>
      member.full_name?.toLowerCase().includes(normalizedSearch) ||
      member.role?.toLowerCase().includes(normalizedSearch)
  );

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-2.5 transition-colors focus-within:border-[#00AFEF]">
        <Search size={14} className="shrink-0 text-muted" />

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members..."
          aria-label="Search team members"
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
        />

        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label="Clear member search"
            className="text-xs text-muted transition-colors hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>

      {/* Member rows */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-12 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-secondary">
              <Search size={17} className="text-muted" />
            </div>

            <p className="text-sm font-semibold text-foreground">
              No members found
            </p>

            <p className="text-xs text-muted">
              {normalizedSearch
                ? "Try a different search term."
                : "Invite your first team member to get started."}
            </p>
          </div>
        ) : (
          filtered.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              isFounder={isFounder}
              onViewProfile={onViewProfile}
              onRemove={onRemove}
              onChangeRole={onChangeRole}
            />
          ))
        )}
      </div>
    </div>
  );
}
