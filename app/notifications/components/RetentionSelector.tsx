
import { ChevronDown, Clock } from "lucide-react";
import { RETENTION_OPTIONS } from "../types";

type Props = {
  value: number;
  onChange: (days: number) => void;
  isSaving: boolean;
};

export default function RetentionSelector({
  value,
  onChange,
  isSaving,
}: Props) {
  const current = RETENTION_OPTIONS.find((o) => o.days === value);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 text-xs text-muted">
        <Clock size={12} />
        <span>Keep for</span>
      </div>

      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={isSaving}
          className="appearance-none rounded-lg border border-border bg-surface pl-3 pr-8 py-1.5 text-xs font-medium text-foreground outline-none cursor-pointer hover:border-[#00AFEF]/50 transition-colors disabled:opacity-60"
        >
          {RETENTION_OPTIONS.map((opt) => (
            <option
              key={opt.days}
              value={opt.days}
              className="bg-surface text-foreground"
            >
              {opt.label}
            </option>
          ))}
        </select>

        <ChevronDown
          size={11}
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted"
        />
      </div>

      {isSaving && (
        <span className="text-[11px] text-purple-400 animate-pulse">
          Saving...
        </span>
      )}
    </div>
  );
}
