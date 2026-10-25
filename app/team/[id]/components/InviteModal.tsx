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

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (!isOpen) {
      setQuery(""); setResults([]); setSelected(null);
      setRole("Collaborator"); setMessage(""); setSentTo([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const searchBuilders = async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setIsSearching(true);

    const { data } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url, professional_title")
      .ilike("full_name", `%${q}%`)
      .not("user_id", "in", `(${existingMemberIds.join(",") || "00000000-0000-0000-0000-000000000000"})`)
      .limit(6);

    setResults(data || []);
    setIsSearching(false);
  };

  const handleQueryChange = (v: string) => {
    setQuery(v);
    setSelected(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchBuilders(v), 350);
  };

  const handleSendInvite = async () => {
    if (!selected) return;
    setIsSending(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsSending(false); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .single();

    const senderName = profile?.full_name || user.email || "The project founder";
    const personalMsg = message.trim()
      ? ` Message: "${message.trim()}"`
      : "";

    await supabase.from("notifications").insert([{
      user_id: selected.user_id,
      title: "Project Invitation",
      message: `${senderName} has invited you to join their project: ${projectTitle} as ${role}.${personalMsg}`,
      type: "invite",
      related_project_id: projectId,
      sender_id: user.id,
    }]);

    setSentTo((prev) => [...prev, selected.user_id]);
    setSelected(null);
    setQuery("");
    setResults([]);
    setMessage("");
    setIsSending(false);
  };

  if (!isMounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-200 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Modal */}
      <div
        className={`fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#1F1F23] bg-[#0F0F11] shadow-2xl transition-all duration-200 ${
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1F1F23] px-6 py-4">
          <div>
            <h2 className="text-sm font-bold text-white">Invite New Member</h2>
            <p className="text-xs text-gray-500 mt-0.5">Search for a builder and assign them a role.</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Search */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400">Search Builder</label>
            <div className="relative">
              <div className="flex items-center gap-2 rounded-xl border border-[#1F1F23] bg-[#121215] px-4 py-3 focus-within:border-white/20 transition-colors">
                <Search size={14} className="text-gray-500 shrink-0" />
                <input
                  type="text"
                  value={selected ? selected.full_name : query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  placeholder="Type a name to search builders..."
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 outline-none"
                />
                {isSearching && <Loader2 size={14} className="animate-spin text-gray-500" />}
                {selected && (
                  <button onClick={() => { setSelected(null); setQuery(""); }} className="text-gray-500 hover:text-white">
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Dropdown results */}
              {results.length > 0 && !selected && (
                <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-xl border border-[#1F1F23] bg-[#0F0F11] shadow-2xl overflow-hidden">
                  {results.map((r) => (
                    <button
                      key={r.user_id}
                      onClick={() => { setSelected(r); setResults([]); setQuery(""); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors text-left"
                    >
                      <div className="h-8 w-8 rounded-full overflow-hidden border border-[#27272A] bg-[#18181B] flex items-center justify-center shrink-0">
                        {r.avatar_url
                          ? <img src={r.avatar_url} alt={r.full_name} className="h-full w-full object-cover" />
                          : <User size={14} className="text-gray-600" />
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{r.full_name}</p>
                        <p className="text-xs text-gray-500 truncate">{r.professional_title || "Builder"}</p>
                      </div>
                      {sentTo.includes(r.user_id) && (
                        <span className="ml-auto text-[11px] text-emerald-400 flex items-center gap-1">
                          <Check size={11} /> Invited
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
            <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/20 px-4 py-3">
              <div className="h-9 w-9 rounded-full overflow-hidden border border-[#27272A] bg-[#18181B] flex items-center justify-center shrink-0">
                {selected.avatar_url
                  ? <img src={selected.avatar_url} alt={selected.full_name} className="h-full w-full object-cover" />
                  : <User size={14} className="text-gray-600" />
                }
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{selected.full_name}</p>
                <p className="text-xs text-gray-500">{selected.professional_title || "Builder"}</p>
              </div>
              <Check size={16} className="ml-auto text-white/20" />
            </div>
          )}

          {/* Role selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-xl border border-[#1F1F23] bg-[#121215] px-4 py-3 text-sm text-white outline-none focus:border-white/20 transition-colors"
            >
              {DEFAULT_ROLES.map((r) => (
                <option key={r} value={r} className="bg-[#121215]">{r}</option>
              ))}
            </select>
          </div>

          {/* Optional message */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400">
              Message <span className="text-gray-600">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="You're invited to join our project!"
              className="w-full resize-none rounded-xl border border-[#1F1F23] bg-[#121215] px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-white/20 transition-colors"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[#1F1F23] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-[#1F1F23] px-4 py-2 text-sm text-gray-400 hover:text-white hover:border-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSendInvite}
            disabled={!selected || isSending}
            className="flex items-center gap-2 rounded-xl bg-[#00AFEF] px-5 py-2 text-sm font-semibold text-white hover:bg-[#008FC5]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? <Loader2 size={14} className="animate-spin" /> : null}
            {isSending ? "Sending..." : "Send Invitation"}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}