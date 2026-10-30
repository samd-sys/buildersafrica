
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
  projectLogo: string;
};

export default function CreateGroupChatModal({
  isOpen,
  onClose,
  projectId,
  projectTitle,
  projectLogo,
}: Props) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [chatName, setChatName] = useState(`${projectTitle} Team`);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setChatName(`${projectTitle} Team`);
      setError(null);
    }
  }, [isOpen, projectTitle]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleCreate = async () => {
    if (!chatName.trim()) {
      setError("Please enter a chat name.");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated.");

      // Check if a team chat already exists for this project
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("project_id", projectId)
        .eq("type", "team")
        .maybeSingle();

      if (existing) {
        router.push(`/messages?group=${existing.id}`);
        onClose();
        return;
      }

      // Create the group conversation
      const { data: conv, error: convErr } = await supabase
        .from("conversations")
        .insert([
          {
            name: chatName.trim(),
            type: "team",
            project_id: projectId,
            created_by: user.id,
          },
        ])
        .select("id")
        .single();

      if (convErr) throw convErr;

      // Fetch all team members
      const { data: members } = await supabase
        .from("team_members")
        .select("user_id")
        .eq("project_id", projectId)
        .neq("user_id", user.id);

      // Fetch founder name for notification
      const { data: founderProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single();

      const founderName = founderProfile?.full_name || "The founder";

      // Notify all team members
      if (members && members.length > 0) {
        const notifications = (
          members as Array<{ user_id: string }>
        ).map((m) => ({
          user_id: m.user_id,
          title: "Team Chat Created",
          message: `${founderName} created a team chat for ${projectTitle}. Join the conversation!`,
          type: "team_message",
          related_project_id: projectId,
          sender_id: user.id,
        }));

        await supabase.from("notifications").insert(notifications);
      }

      onClose();
      router.push(`/messages?group=${conv.id}`);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setCreating(false);
    }
  };

  if (!isMounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-200 ${
          isOpen
            ? "opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />

      {/* Modal */}
      <div
        className={`fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface shadow-2xl transition-all duration-200 ${
          isOpen
            ? "opacity-100 scale-100"
            : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface-secondary">
              {projectLogo ? (
                <img
                  src={projectLogo}
                  alt={projectTitle}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Users size={16} className="text-[#00AFEF]" />
              )}
            </div>

            <div>
              <p className="text-sm font-bold text-foreground">
                Create Team Chat
              </p>
              <p className="text-xs text-muted">{projectTitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-5">
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-500">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">
              Chat Name
            </label>

            <input
              type="text"
              value={chatName}
              onChange={(e) => {
                setChatName(e.target.value);
                setError(null);
              }}
              maxLength={80}
              autoFocus
              className="w-full rounded-xl border border-border bg-surface-secondary px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-[#00AFEF]/50"
            />
          </div>

          <p className="text-xs text-muted">
            All team members will be notified and can join immediately.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2 text-sm text-muted transition-colors hover:bg-surface-secondary hover:text-foreground"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleCreate}
            disabled={!chatName.trim() || creating}
            className="flex items-center gap-2 rounded-xl bg-[#00AFEF] px-5 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-[#00AFEF]/80 disabled:opacity-50"
          >
            {creating ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Users size={14} />
            )}

            {creating ? "Creating..." : "Create Chat"}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
