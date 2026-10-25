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

  const filtered = members.filter(
    (m) =>
      m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.role?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="flex items-center gap-3 rounded-xl border border-[#1F1F23] bg-[#121215] px-4 py-2.5 focus-within:border-purple-500/40 transition-colors">
        <Search size={14} className="text-gray-500 shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members..."
          className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 outline-none"
        />
      </div>

      {/* Member rows */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <p className="text-sm font-semibold text-white">No members found</p>
            <p className="text-xs text-gray-500">
              {search ? "Try a different search term." : "Invite your first team member to get started."}
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