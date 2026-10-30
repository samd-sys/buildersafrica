
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  User,
  MapPin,
  CalendarDays,
  Link2,
  ExternalLink,
  Globe,
  UserMinus,
  RefreshCw,
  Loader2,
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
  if (!d) return "—";

  try {
    const date = new Date(d);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "—";
  }
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

  // Mount portal after the component has rendered on the client.
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Reset panel state whenever the selected member changes.
  // Keep this dependency array constant on every render.
  useEffect(() => {
    if (!member) {
      setIsChangingRole(false);
      setSelectedRole("");
      setIsSavingRole(false);
      setConfirmRemove(false);
      return;
    }

    setSelectedRole(member.role);
    setIsChangingRole(false);
    setIsSavingRole(false);
    setConfirmRemove(false);
  }, [member?.user_id, member?.role]);

  // Escape key closes the panel only while it is open.
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSaveRole = async () => {
    if (!member || isSavingRole) return;

    if (selectedRole === member.role) {
      setIsChangingRole(false);
      return;
    }

    setIsSavingRole(true);

    try {
      await onChangeRole(member, selectedRole);
      setIsChangingRole(false);
    } catch (error) {
      console.error("Failed to update member role:", error);
      alert("Unable to update the member's role. Please try again.");
    } finally {
      setIsSavingRole(false);
    }
  };

  if (!isMounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen
            ? "opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-profile-title"
        aria-hidden={!isOpen}
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[440px] flex-col border-l border-border bg-surface text-foreground shadow-2xl transition-all duration-300 ease-in-out ${
          isOpen
            ? "visible translate-x-0 opacity-100"
            : "invisible pointer-events-none translate-x-full opacity-0"
        }`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <span
            id="member-profile-title"
            className="text-sm font-medium text-muted"
          >
            Member Profile
          </span>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close member profile"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00AFEF]"
          >
            <X size={16} />
          </button>
        </div>

        {member && (
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            {/* Avatar + name */}
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-surface-secondary">
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.full_name || "Team member"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User size={32} className="text-muted" />
                  )}
                </div>

                {/* Status indicator */}
                <span
                  className={`absolute bottom-1 right-1 h-3 w-3 rounded-full border-2 border-surface ${
                    member.status === "active"
                      ? "bg-emerald-500"
                      : "bg-gray-400 dark:bg-gray-600"
                  }`}
                />
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">
                  {member.full_name || "Unnamed Builder"}
                </h2>

                {member.professional_title && (
                  <p className="text-sm font-medium text-[#00AFEF]">
                    {member.professional_title}
                  </p>
                )}

                {member.country && (
                  <p className="flex items-center justify-center gap-1 text-xs text-muted">
                    <MapPin size={11} />
                    {member.country}
                  </p>
                )}
              </div>

              {/* Role badge + change role */}
              {isChangingRole ? (
                <div
                  className="flex w-full items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    disabled={isSavingRole}
                    aria-label="Select new member role"
                    className="min-w-0 flex-1 rounded-lg border border-border bg-surface-secondary px-3 py-2 text-xs text-foreground outline-none focus:border-[#00AFEF] disabled:opacity-50"
                  >
                    {DEFAULT_ROLES.map((r) => (
                      <option
                        key={r}
                        value={r}
                        className="bg-surface text-foreground"
                      >
                        {r}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleSaveRole}
                    disabled={isSavingRole}
                    className="flex items-center justify-center rounded-lg bg-[#00AFEF] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#009bd4] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSavingRole ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      "Save"
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsChangingRole(false)}
                    disabled={isSavingRole}
                    className="rounded-lg border border-border px-3 py-2 text-xs text-muted transition-colors hover:bg-surface-secondary hover:text-foreground disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-[#00AFEF]/20 bg-[#00AFEF]/10 px-3 py-1 text-xs font-semibold text-[#00AFEF]">
                    {member.role}
                  </span>

                  <span
                    className={`text-xs font-medium ${
                      member.status === "active"
                        ? "text-emerald-500"
                        : "text-muted"
                    }`}
                  >
                    {member.status === "active"
                      ? "● Online"
                      : "○ Offline"}
                  </span>
                </div>
              )}
            </div>

            {/* Joined date */}
            <div className="flex items-center gap-2 text-xs text-muted">
              <CalendarDays size={13} />
              <span>Joined {formatDate(member.joined_at)}</span>
            </div>

            {/* Bio */}
            {member.bio && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                  About
                </h4>

                <div className="rounded-xl border border-border bg-surface-secondary p-4">
                  <p className="text-xs leading-relaxed text-foreground">
                    {member.bio}
                  </p>
                </div>
              </div>
            )}

            {/* Skills */}
            {member.skills && member.skills.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Skills
                </h4>

                <div className="rounded-xl border border-border bg-surface-secondary p-4">
                  <div className="flex flex-wrap gap-2">
                    {member.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-lg border border-[#00AFEF]/20 bg-[#00AFEF]/10 px-3 py-1 text-xs font-medium text-[#00AFEF]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Contact */}
            {(member.email ||
              member.github_url ||
              member.linkedin_url ||
              member.website_url) && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Contact
                </h4>

                <div className="space-y-2.5 rounded-xl border border-border bg-surface-secondary p-4">
                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      className="flex items-center gap-2 text-xs text-muted transition-colors hover:text-[#00AFEF]"
                    >
                      <User size={13} className="shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </a>
                  )}

                  {member.github_url && (
                    <a
                      href={member.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-muted transition-colors hover:text-[#00AFEF]"
                    >
                      <Link2 size={13} className="shrink-0" />
                      <span className="truncate">{member.github_url}</span>
                    </a>
                  )}

                  {member.linkedin_url && (
                    <a
                      href={member.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-muted transition-colors hover:text-[#00AFEF]"
                    >
                      <ExternalLink size={13} className="shrink-0" />
                      <span className="truncate">{member.linkedin_url}</span>
                    </a>
                  )}

                  {member.website_url && (
                    <a
                      href={member.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-muted transition-colors hover:text-[#00AFEF]"
                    >
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
                    type="button"
                    onClick={() => setIsChangingRole(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface-secondary py-2.5 text-xs font-medium text-foreground transition-colors hover:border-[#00AFEF]/40 hover:bg-surface"
                  >
                    <RefreshCw size={13} />
                    Change Role
                  </button>
                )}

                {/* Remove confirmation */}
                {confirmRemove ? (
                  <div className="space-y-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                    <p className="text-center text-xs text-red-500">
                      Remove{" "}
                      <span className="font-semibold">
                        {member.full_name}
                      </span>{" "}
                      from the team?
                    </p>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmRemove(false)}
                        className="flex-1 rounded-lg border border-border py-2 text-xs text-muted transition-colors hover:bg-surface-secondary hover:text-foreground"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onRemove(member);
                          onClose();
                        }}
                        className="flex-1 rounded-lg border border-red-500/20 bg-red-500/10 py-2 text-xs font-semibold text-red-500 transition-colors hover:bg-red-500/20"
                      >
                        Yes, Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmRemove(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-surface-secondary py-2.5 text-xs font-medium text-red-500 transition-colors hover:border-red-500/40 hover:bg-red-500/5"
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
