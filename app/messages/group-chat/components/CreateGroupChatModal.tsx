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
  const [chatName, setChatName]   = useState(`${projectTitle} Team`);
  const [creating, setCreating]   = useState(false);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (isOpen) {
      setChatName(`${projectTitle} Team`);
      setError(null);
    }
  }, [isOpen, projectTitle]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleCreate = async () => {
    if (!chatName.trim()) { setError("Please enter a chat name."); return; }
    setCreating(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
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
        .insert([{
          name:       chatName.trim(),
          type:       "team",
          project_id: projectId,
          created_by: user.id,
        }])
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
        const notifications = (members as Array<{ user_id: string }>).map((m) => ({
          user_id:            m.user_id,
          title:              "Team Chat Created",
          message:            `${founderName} created a team chat for ${projectTitle}. Join the conversation!`,
          type:               "team_message",
          related_project_id: projectId,
          sender_id:          user.id,
        }));
        await supabase.from("notifications").insert(notifications);
      }

      onClose();
      router.push(`/messages?group=${conv.id}`);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setCreating(false);
    }
  };

  if (!isMounted) return null;

  return createPortal(
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-200 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <div
        className={`fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#1F1F23] bg-[#0F0F11] shadow-2xl transition-all duration-200 ${
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1F1F23] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#1F1F23] bg-[#121215] overflow-hidden shrink-0">
              {projectLogo ? (
                <img src={projectLogo} alt={projectTitle} className="h-full w-full object-cover" />
              ) : (
                <Users size={16} className="text-[#00AFEF]" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-white">Create Team Chat</p>
              <p className="text-xs text-gray-500">{projectTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-300">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400">Chat Name</label>
            <input
              type="text"
              value={chatName}
              onChange={(e) => { setChatName(e.target.value); setError(null); }}
              maxLength={80}
              autoFocus
              className="w-full rounded-xl border border-[#1F1F23] bg-[#121215] px-4 py-3 text-sm text-white outline-none focus:border-[#00AFEF]/50 transition-colors"
            />
          </div>
          <p className="text-xs text-gray-500">
            All team members will be notified and can join immediately.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[#1F1F23] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-[#1F1F23] px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!chatName.trim() || creating}
            className="flex items-center gap-2 rounded-xl bg-[#00AFEF] px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-[#00AFEF]/80 transition-colors disabled:opacity-50"
          >
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />}
            {creating ? "Creating..." : "Create Chat"}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}