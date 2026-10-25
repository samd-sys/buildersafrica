import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X, User, MapPin, CalendarDays, Link2,
  ExternalLink, Globe, UserMinus, RefreshCw, Loader2,
} from "lucide-react";
import { TeamMember, DEFAULT_ROLES } from "../types";

type Props = {
  member: TeamMember | null;
  isFounder: boolean;
  onClose: () => void;
  onRemove: (member: TeamMember) => void;
  onChangeRole: (member: TeamMember, newRole: string) => Promise<void>;
};

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric",
    });
  } catch { return "—"; }
}

export default function MemberProfilePanel({
  member,
  isFounder,
  onClose,
  onRemove,
  onChangeRole,
}: Props) {
  const [isMounted, setIsMounted] = useState(false);
  const [isChangingRole, setIsChangingRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const isOpen = !!member;

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (!member) return;
    setSelectedRole(member.role);
    setIsChangingRole(false);
    setConfirmRemove(false);
  }, [member?.user_id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSaveRole = async () => {
    if (!member || selectedRole === member.role) { setIsChangingRole(false); return; }
    setIsSavingRole(true);
    await onChangeRole(member, selectedRole);
    setIsSavingRole(false);
    setIsChangingRole(false);
  };

  if (!isMounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[440px] flex-col border-l border-[#1F1F23] bg-[#0C0C0E] shadow-2xl transition-all duration-300 ease-in-out ${
          isOpen
            ? "translate-x-0 opacity-100 visible"
            : "translate-x-full opacity-0 invisible pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#1F1F23] px-6 py-4">
          <span className="text-sm font-medium text-gray-400">Member Profile</span>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {member && (
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Avatar + name */}
            <div className="flex flex-col items-center text-center gap-3">
              <div className="relative">
                <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-[#27272A] bg-[#18181B] flex items-center justify-center">
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt={member.full_name} className="h-full w-full object-cover" />
                  ) : (
                    <User size={32} className="text-gray-600" />
                  )}
                </div>
                <span className={`absolute bottom-1 right-1 h-3 w-3 rounded-full border-2 border-[#0C0C0E] ${
                  member.status === "active" ? "bg-emerald-400" : "bg-gray-600"
                }`} />
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-bold text-white">
                  {member.full_name || "Unnamed Builder"}
                </h2>
                {member.professional_title && (
                  <p className="text-sm text-[#00AFEF] font-medium">
                    {member.professional_title}
                  </p>
                )}
                {member.country && (
                  <p className="flex items-center justify-center gap-1 text-xs text-gray-500">
                    <MapPin size={11} />
                    {member.country}
                  </p>
                )}
              </div>

              {/* Role badge + change role */}
              {isChangingRole ? (
                <div className="flex items-center gap-2 w-full" onClick={(e) => e.stopPropagation()}>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="flex-1 rounded-lg border border-[#1F1F23] bg-[#121215] px-3 py-2 text-xs text-white outline-none focus:border-white/20"
                  >
                    {DEFAULT_ROLES.map((r) => (
                      <option key={r} value={r} className="bg-[#121215]">{r}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleSaveRole}
                    disabled={isSavingRole}
                    className="rounded-lg bg-[#00AFEF]/70 px-3 py-2 text-xs font-semibold text-white hover:bg-[#00AFEF]/50 transition-colors disabled:opacity-60"
                  >
                    {isSavingRole ? <Loader2 size={12} className="animate-spin" /> : "Save"}
                  </button>
                  <button
                    onClick={() => setIsChangingRole(false)}
                    className="rounded-lg border border-[#1F1F23] px-3 py-2 text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-[#00AFEF]/20 bg-[#00AFEF]/10 px-3 py-1 text-xs font-semibold text-[#00AFEF]">
                    {member.role}
                  </span>
                  <span className={`text-xs font-medium ${
                    member.status === "active" ? "text-emerald-400" : "text-gray-500"
                  }`}>
                    {member.status === "active" ? "● Online" : "○ Offline"}
                  </span>
                </div>
              )}
            </div>

            {/* Joined date */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <CalendarDays size={13} />
              <span>Joined {formatDate(member.joined_at)}</span>
            </div>

            {/* Bio */}
            {member.bio && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">About</h4>
                <div className="rounded-xl border border-[#1F1F23] bg-[#121215] p-4">
                  <p className="text-xs leading-relaxed text-gray-300">{member.bio}</p>
                </div>
              </div>
            )}

            {/* Skills */}
            {member.skills && member.skills.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Skills</h4>
                <div className="rounded-xl border border-[#1F1F23] bg-[#121215] p-4">
                  <div className="flex flex-wrap gap-2">
                    {member.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-[#00AFEF]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Contact */}
            {(member.email || member.github_url || member.linkedin_url || member.website_url) && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Contact</h4>
                <div className="rounded-xl border border-[#1F1F23] bg-[#121215] p-4 space-y-2.5">
                  {member.github_url && (
                    <a href={member.github_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors">
                      <Link2 size={13} className="shrink-0" />
                      <span className="truncate">{member.github_url}</span>
                    </a>
                  )}
                  {member.linkedin_url && (
                    <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors">
                      <ExternalLink size={13} className="shrink-0" />
                      <span className="truncate">{member.linkedin_url}</span>
                    </a>
                  )}
                  {member.website_url && (
                    <a href={member.website_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors">
                      <Globe size={13} className="shrink-0" />
                      <span className="truncate">{member.website_url}</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Founder actions */}
            {isFounder && (
              <div className="space-y-2 pt-2">
                {!isChangingRole && (
                  <button
                    onClick={() => setIsChangingRole(true)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#1F1F23] bg-[#121215] py-2.5 text-xs font-medium text-gray-300 hover:border-white/20 hover:text-white transition-colors"
                  >
                    <RefreshCw size={13} />
                    Change Role
                  </button>
                )}

                {confirmRemove ? (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] p-4 space-y-3">
                    <p className="text-xs text-red-300 text-center">
                      Remove <span className="font-semibold">{member.full_name}</span> from the team?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmRemove(false)}
                        className="flex-1 rounded-lg border border-[#1F1F23] py-2 text-xs text-gray-400 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => { onRemove(member); onClose(); }}
                        className="flex-1 rounded-lg bg-red-500/10 border border-red-500/20 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors"
                      >
                        Yes, Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmRemove(true)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-500/10 bg-[#121215] py-2.5 text-xs font-medium text-red-400/70 hover:border-red-500/30 hover:text-red-400 transition-colors"
                  >
                    <UserMinus size={13} />
                    Remove from Team
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>,
    document.body
  );
}