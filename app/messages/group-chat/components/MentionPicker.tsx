import { useEffect, useRef } from "react";
import { User } from "lucide-react";

export type TeamMemberOption = {
  user_id: string;
  full_name: string;
  avatar_url: string;
};

type Props = {
  query: string;
  members: TeamMemberOption[];
  onSelect: (member: TeamMemberOption) => void;
  onClose: () => void;
};

export default function MentionPicker({
  query,
  members,
  onSelect,
  onClose,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const filtered = members.filter((m) =>
    m.full_name.toLowerCase().includes(query.toLowerCase())
  );

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  if (filtered.length === 0) return null;

  return (
    <div
      ref={ref}
      className="absolute bottom-full left-0 mb-2 z-30 w-56 rounded-xl border border-[#1F1F23] bg-[#0F0F11] shadow-2xl overflow-hidden"
    >
      <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-600 border-b border-[#1F1F23]">
        Mention a member
      </p>
      <div className="max-h-48 overflow-y-auto py-1">
        {filtered.map((m) => (
          <button
            key={m.user_id}
            onMouseDown={(e) => {
              e.preventDefault(); // prevent input blur
              onSelect(m);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/[0.04] transition-colors text-left"
          >
            <div className="h-7 w-7 rounded-full overflow-hidden border border-[#27272A] bg-[#18181B] flex items-center justify-center shrink-0">
              {m.avatar_url ? (
                <img src={m.avatar_url} alt={m.full_name} className="h-full w-full object-cover" />
              ) : (
                <User size={12} className="text-gray-600" />
              )}
            </div>
            <span className="text-sm text-white truncate">{m.full_name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}