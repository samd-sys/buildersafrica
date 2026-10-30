
"use client";

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
      className="absolute bottom-full left-0 z-30 mb-2 w-56 overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
    >
      <p className="border-b border-border px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
        Mention a member
      </p>

      <div className="max-h-48 overflow-y-auto py-1">
        {filtered.map((m) => (
          <button
            key={m.user_id}
            type="button"
            aria-label={`Mention ${m.full_name}`}
            onMouseDown={(e) => {
              e.preventDefault(); // Prevent input blur
              onSelect(m);
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-surface-secondary"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-secondary">
              {m.avatar_url ? (
                <img
                  src={m.avatar_url}
                  alt={m.full_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User size={12} className="text-muted" />
              )}
            </div>

            <span className="truncate text-sm text-foreground">
              {m.full_name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
