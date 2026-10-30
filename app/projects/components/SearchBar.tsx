
import { Search, X } from "lucide-react";

type Props = {
  value: string;
  onChange: (v: string) => void;
};

export default function SearchBar({ value, onChange }: Props) {
  return (
    <div className="flex w-full items-center gap-8 rounded-2xl border border-border bg-surface px-4 py-3.5 transition-colors focus-within:border-[#00AFEF] md:ml-54 md:w-180 md:px-5">
      <Search size={18} className="shrink-0 text-muted" />

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search projects by name, category, or technology..."
        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted outline-none"
      />

      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="text-muted transition-colors hover:text-foreground"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
