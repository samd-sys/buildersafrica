import { useState } from "react";
import { User, MoreVertical, UserMinus, RefreshCw } from "lucide-react";
import { TeamMember } from "../types";

type Props = {
  member: TeamMember;
  isFounder: boolean;
  onViewProfile: (member: TeamMember) => void;
  onRemove: (member: TeamMember) => void;
  onChangeRole: (member: TeamMember) => void;
};

const ROLE_COLORS: Record<string, string> = {
  "Project Lead":        "text-amber-400 bg-amber-400/10 border-amber-400/20",
  "Frontend Developer":  "text-blue-400 bg-blue-400/10 border-blue-400/20",
  "Backend Developer":   "text-purple-400 bg-purple-400/10 border-purple-400/20",
  "Full Stack Developer":"text-indigo-400 bg-indigo-400/10 border-indigo-400/20",
  "UI/UX Designer":      "text-pink-400 bg-pink-400/10 border-pink-400/20",
  "AI Engineer":         "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  "Product Manager":     "text-orange-400 bg-orange-400/10 border-orange-400/20",
  "QA Engineer":         "text-red-400 bg-red-400/10 border-red-400/20",
  "DevOps Engineer":     "text-teal-400 bg-teal-400/10 border-teal-400/20",
  "Data Scientist":      "text-violet-400 bg-violet-400/10 border-violet-400/20",
  "Marketing Expert":    "text-rose-400 bg-rose-400/10 border-rose-400/20",
  "Content Writer":      "text-lime-400 bg-lime-400/10 border-lime-400/20",
  "Business Advisor":    "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  "Collaborator":        "text-gray-400 bg-gray-400/10 border-gray-400/20",
};

function getRoleColor(role: string) {
  return ROLE_COLORS[role] ?? "text-gray-400 bg-gray-400/10 border-gray-400/20";
}

export default function MemberCard({
  member,
  isFounder,
  onViewProfile,
  onRemove,
  onChangeRole,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      onClick={() => onViewProfile(member)}
      className="group flex items-center gap-4 rounded-xl border border-[#1F1F23] bg-[#121215] px-4 py-3.5 cursor-pointer transition-all hover:border-white/20"
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="h-10 w-10 rounded-full overflow-hidden border border-[#27272A] bg-[#18181B] flex items-center justify-center">
          {member.avatar_url ? (
            <img src={member.avatar_url} alt={member.full_name} className="h-full w-full object-cover" />
          ) : (
            <User size={16} className="text-gray-600" />
          )}
        </div>
        {/* Status dot */}
        <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#121215] ${
          member.status === "active" ? "bg-emerald-400" : "bg-gray-600"
        }`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">
          {member.full_name || "Unnamed Builder"}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {member.professional_title || member.email || "—"}
        </p>
      </div>

      {/* Role badge */}
      <span className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold ${getRoleColor(member.role)}`}>
        {member.role}
      </span>

      {/* Status label */}
      <span className={`shrink-0 text-[11px] font-medium ${
        member.status === "active" ? "text-emerald-400" : "text-gray-600"
      }`}>
        {member.status === "active" ? "Online" : "Offline"}
      </span>

      {/* Action menu — founder only */}
      {isFounder && (
        <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-600 hover:bg-white/5 hover:text-white transition-colors"
          >
            <MoreVertical size={14} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border border-[#1F1F23] bg-[#0F0F11] shadow-2xl overflow-hidden">
              <button
                onClick={() => { onChangeRole(member); setMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-400 hover:bg-white/[0.04] hover:text-white transition-colors"
              >
                <RefreshCw size={13} />
                Change Role
              </button>
              <button
                onClick={() => { onRemove(member); setMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/[0.06] transition-colors"
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