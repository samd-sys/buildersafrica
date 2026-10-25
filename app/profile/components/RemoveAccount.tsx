"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";

const CONSEQUENCES = [
  "All your projects and their data will be permanently deleted",
  "All your team memberships and applications will be removed",
  "All your messages and conversations will be deleted",
  "Your profile and connections will be erased",
  "This action cannot be undone",
];

export default function RemoveAccount() {
  const router  = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [status,       setStatus]       = useState<"idle" | "loading" | "error">("idle");
  const [error,        setError]        = useState("");

  const canDelete = confirmation === "DELETE";

  const handleDelete = async () => {
    if (!canDelete) return;
    setStatus("loading");
    setError("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated.");

      // Call the Edge Function we deployed
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete account.");
      }

      // Sign out and redirect to home
      await supabase.auth.signOut();
      router.push("/");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again or contact support."
      );
      setStatus("error");
    }
  };

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-white">Remove Account</h2>
        <p className="text-sm text-gray-400">
          Permanently delete your BuildersAfrica account and all associated data.
        </p>
      </div>

      {/* Warning card */}
      <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-6 space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className="text-red-400 shrink-0" />
          <h3 className="text-sm font-semibold text-red-400">This action is permanent</h3>
        </div>

        <p className="text-sm text-gray-300 leading-relaxed">
          Once you delete your account, there is no going back. Please be certain before proceeding.
        </p>

        <ul className="space-y-2">
          {CONSEQUENCES.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs text-gray-400">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Confirmation input */}
      <div className="rounded-2xl border border-[#1F1F23] bg-[#121215] p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Trash2 size={16} className="text-red-400" />
          <h3 className="text-sm font-semibold text-white">Confirm Deletion</h3>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-gray-400">
            Type <span className="font-bold text-red-400 tracking-widest">DELETE</span> to confirm
          </label>
          <input
            type="text"
            value={confirmation}
            onChange={(e) => {
              setConfirmation(e.target.value);
              setError("");
              setStatus("idle");
            }}
            placeholder="Type DELETE here"
            className={`w-full rounded-xl border bg-[#0F0F11] px-4 py-3 text-sm font-mono text-white placeholder:text-white/20 outline-none transition-colors ${
              canDelete
                ? "border-red-500/40 focus:border-red-500/60"
                : "border-[#1F1F23] focus:border-[#00AFEF]/50"
            }`}
          />
        </div>

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        <button
          onClick={handleDelete}
          disabled={!canDelete || status === "loading"}
          className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {status === "loading" ? (
            <><Loader2 size={14} className="animate-spin" /> Deleting account...</>
          ) : (
            <><Trash2 size={14} /> Permanently Delete Account</>
          )}
        </button>

        <p className="text-xs text-gray-600">
          Need help instead?{" "}
          <button
            onClick={() => {/* switch to support tab handled by parent */}}
            className="text-[#00AFEF] hover:underline"
          >
            Contact support
          </button>
        </p>
      </div>
    </div>
  );
}