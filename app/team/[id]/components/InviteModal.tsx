
"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Search, User, Loader2, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { DEFAULT_ROLES } from "../types";

type SearchResult = {
  user_id: string;
  full_name: string;
  avatar_url: string;
  professional_title: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
  existingMemberIds: string[];
};

export default function InviteModal({
  isOpen,
  onClose,
  projectId,
  projectTitle,
  existingMemberIds,
}: Props) {
  const [isMounted, setIsMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [role, setRole] = useState("Collaborator");
  const [message, setMessage] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sentTo, setSentTo] = useState<string[]>([]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRequestRef = useRef(0);

  // Ensure portal is rendered only on the client.
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Reset modal state when closed.
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      setSelected(null);
      setRole("Collaborator");
      setMessage("");
      setSentTo([]);
      setIsSearching(false);

      searchRequestRef.current += 1;

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    }
  }, [isOpen]);

  // Close modal when Escape is pressed.
  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  // Clear pending debounce when component unmounts.
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      searchRequestRef.current += 1;
    };
  }, []);

  // Search available builders.
  const searchBuilders = async (q: string) => {
    const requestId = ++searchRequestRef.current;

    if (!q.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, professional_title")
        .ilike("full_name", `%${q.trim()}%`)
        .not(
          "user_id",
          "in",
          `(${existingMemberIds.join(",") || "00000000-0000-0000-0000-000000000000"})`
        )
        .limit(6);

      // Ignore outdated search responses.
      if (requestId !== searchRequestRef.current) return;

      if (error) {
        console.error("Builder search failed:", error);
        setResults([]);
        return;
      }

      setResults(data || []);
    } catch (err) {
      if (requestId === searchRequestRef.current) {
        console.error("Builder search failed:", err);
        setResults([]);
      }
    } finally {
      if (requestId === searchRequestRef.current) {
        setIsSearching(false);
      }
    }
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setSelected(null);
    setResults([]);

    searchRequestRef.current += 1;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!value.trim()) {
      setIsSearching(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      searchBuilders(value);
    }, 350);
  };

  // Send invitation notification.
  const handleSendInvite = async () => {
    if (!selected || isSending) return;

    setIsSending(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        alert("Please sign in to send an invitation.");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single();

      if (profileError) {
        console.error("Failed to retrieve sender profile:", profileError);
      }

      const senderName =
        profile?.full_name || user.email || "The project founder";

      const personalMsg = message.trim()
        ? ` Message: "${message.trim()}"`
        : "";

      const { error } = await supabase.from("notifications").insert([
        {
          user_id: selected.user_id,
          title: "Project Invitation",
          message: `${senderName} has invited you to join their project: ${projectTitle} as ${role}.${personalMsg}`,
          type: "invite",
          related_project_id: projectId,
          sender_id: user.id,
        },
      ]);

      if (error) {
        console.error("Invitation failed:", error);
        alert("Unable to send the invitation. Please try again.");
        return;
      }

      setSentTo((prev) => [...prev, selected.user_id]);
      setSelected(null);
      setQuery("");
      setResults([]);
      setMessage("");
    } catch (err) {
      console.error("Failed to send invitation:", err);
      alert("Something went wrong while sending the invitation.");
    } finally {
      setIsSending(false);
    }
  };

  if (!isMounted || !isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-modal-title"
        className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-surface text-foreground shadow-2xl transition-all duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2
              id="invite-modal-title"
              className="text-sm font-bold text-foreground"
            >
              Invite New Member
            </h2>

            <p className="mt-0.5 text-xs text-muted">
              Search for a builder and assign them a role.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close invitation modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00AFEF]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          {/* Search */}
          <div className="space-y-1.5">
            <label
              htmlFor="builder-search"
              className="text-xs font-medium text-muted"
            >
              Search Builder
            </label>

            <div className="relative">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-secondary px-4 py-3 transition-colors focus-within:border-[#00AFEF]">
                <Search size={14} className="shrink-0 text-muted" />

                <input
                  id="builder-search"
                  type="text"
                  value={selected ? selected.full_name : query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  placeholder="Type a name to search builders..."
                  className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
                />

                {isSearching && (
                  <Loader2
                    size={14}
                    className="animate-spin text-muted"
                  />
                )}

                {selected && (
                  <button
                    type="button"
                    aria-label="Clear selected builder"
                    onClick={() => {
                      setSelected(null);
                      setQuery("");
                      setResults([]);
                    }}
                    className="text-muted transition-colors hover:text-foreground"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Dropdown results */}
              {results.length > 0 && !selected && (
                <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
                  {results.map((r) => (
                    <button
                      type="button"
                      key={r.user_id}
                      onClick={() => {
                        searchRequestRef.current += 1;

                        setSelected(r);
                        setResults([]);
                        setQuery("");
                        setIsSearching(false);

                        if (debounceRef.current) {
                          clearTimeout(debounceRef.current);
                          debounceRef.current = null;
                        }
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-secondary focus-visible:bg-surface-secondary focus-visible:outline-none"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-secondary">
                        {r.avatar_url ? (
                          <img
                            src={r.avatar_url}
                            alt={r.full_name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User size={14} className="text-muted" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {r.full_name}
                        </p>

                        <p className="truncate text-xs text-muted">
                          {r.professional_title || "Builder"}
                        </p>
                      </div>

                      {sentTo.includes(r.user_id) && (
                        <span className="ml-auto flex items-center gap-1 text-[11px] text-emerald-500">
                          <Check size={11} />
                          Invited
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected builder preview */}
          {selected && (
            <div className="flex items-center gap-3 rounded-xl border border-[#00AFEF]/30 bg-[#00AFEF]/5 px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-secondary">
                {selected.avatar_url ? (
                  <img
                    src={selected.avatar_url}
                    alt={selected.full_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User size={14} className="text-muted" />
                )}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {selected.full_name}
                </p>

                <p className="truncate text-xs text-muted">
                  {selected.professional_title || "Builder"}
                </p>
              </div>

              <Check size={16} className="ml-auto text-[#00AFEF]" />
            </div>
          )}

          {/* Role selector */}
          <div className="space-y-1.5">
            <label
              htmlFor="invite-role"
              className="text-xs font-medium text-muted"
            >
              Role
            </label>

            <select
              id="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-secondary px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-[#00AFEF] focus-visible:ring-2 focus-visible:ring-[#00AFEF]/20"
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
          </div>

          {/* Optional message */}
          <div className="space-y-1.5">
            <label
              htmlFor="invite-message"
              className="text-xs font-medium text-muted"
            >
              Message{" "}
              <span className="text-muted">(optional)</span>
            </label>

            <textarea
              id="invite-message"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="You're invited to join our project!"
              className="w-full resize-none rounded-xl border border-border bg-surface-secondary px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-[#00AFEF] focus-visible:ring-2 focus-visible:ring-[#00AFEF]/20"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2 text-sm text-muted transition-colors hover:border-[#00AFEF]/40 hover:bg-surface-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00AFEF]"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSendInvite}
            disabled={!selected || isSending}
            className="flex items-center gap-2 rounded-xl bg-[#00AFEF] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#009bd4] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00AFEF] focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            {isSending && (
              <Loader2 size={14} className="animate-spin" />
            )}

            {isSending ? "Sending..." : "Send Invitation"}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
