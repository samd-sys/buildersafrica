import { Search, X } from "lucide-react";

type Props = {
  value: string;
  onChange: (v: string) => void;
};

export default function SearchBar({ value, onChange }: Props) {
  return (
    <div className="w-full md:w-180 md:ml-54 flex items-center gap-8 rounded-2xl border border-white/30 bg-[#121215] px-4 md:px-5 py-3.5 transition-colors focus-within:border-[#00AFEF]">
      <Search size={18} className="shrink-0 text-gray-500" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search projects by name, category, or technology..."
        className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="text-gray-500 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}