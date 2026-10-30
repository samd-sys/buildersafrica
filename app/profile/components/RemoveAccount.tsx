
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
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  const canDelete = confirmation === "DELETE";

  const handleDelete = async () => {
    if (!canDelete) return;

    setStatus("loading");
    setError("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) throw new Error("Not authenticated.");

      // Call the deployed Edge Function
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
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
    <div className="space-y-8 p-4 sm:p-8">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-foreground">
          Remove Account
        </h2>
        <p className="text-sm text-muted">
          Permanently delete your BuildersAfrica account and all associated data.
        </p>
      </div>

      {/* Warning card */}
      <div className="space-y-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
        <div className="flex items-center gap-2">
          <AlertTriangle
            size={18}
            className="shrink-0 text-red-500"
            aria-hidden="true"
          />
          <h3 className="text-sm font-semibold text-red-500">
            This action is permanent
          </h3>
        </div>

        <p className="text-sm leading-relaxed text-foreground">
          Once you delete your account, there is no going back. Please be
          certain before proceeding.
        </p>

        <ul className="space-y-2">
          {CONSEQUENCES.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-2.5 text-xs text-muted"
            >
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Confirmation input */}
      <div className="space-y-5 rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-center gap-2">
          <Trash2
            size={16}
            className="text-red-500"
            aria-hidden="true"
          />
          <h3 className="text-sm font-semibold text-foreground">
            Confirm Deletion
          </h3>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="delete-confirmation"
            className="text-xs text-muted"
          >
            Type{" "}
            <span className="font-bold tracking-widest text-red-500">
              DELETE
            </span>{" "}
            to confirm
          </label>

          <input
            id="delete-confirmation"
            type="text"
            value={confirmation}
            onChange={(e) => {
              setConfirmation(e.target.value);
              setError("");
              setStatus("idle");
            }}
            placeholder="Type DELETE here"
            autoComplete="off"
            aria-invalid={!!error}
            className={`w-full rounded-xl border bg-background px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted outline-none transition-colors ${
              canDelete
                ? "border-red-500/40 focus:border-red-500/60"
                : "border-border focus:border-[#00AFEF]/50"
            }`}
          />
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-500"
          >
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleDelete}
          disabled={!canDelete || status === "loading"}
          className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-500 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {status === "loading" ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Deleting account...
            </>
          ) : (
            <>
              <Trash2 size={14} />
              Permanently Delete Account
            </>
          )}
        </button>

        <p className="text-xs text-muted">
          Need help instead?{" "}
          <button
            type="button"
            onClick={() => {
              /* Support tab switching is handled by the parent */
            }}
            className="text-[#00AFEF] hover:underline"
          >
            Contact support
          </button>
        </p>
      </div>
    </div>
  );
}
