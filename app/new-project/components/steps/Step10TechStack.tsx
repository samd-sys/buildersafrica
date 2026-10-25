import { useState } from "react";
import { TECH_SUGGESTIONS } from "../../types/project";

type Props = {
  value: string[];
  onChange: (v: string[]) => void;
  error?: string;
};

export default function Step10TechStack({ value, onChange, error }: Props) {
  const [input, setInput] = useState("");

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setInput("");
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === "Backspace" && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const suggestions = TECH_SUGGESTIONS.filter(
    (s) =>
      !value.includes(s) &&
      (input === "" || s.toLowerCase().includes(input.toLowerCase()))
  ).slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-white">
          What technologies will you use?
        </h2>
        <p className="text-sm text-gray-400">
          Type a technology and press Enter, or pick from suggestions below.
        </p>
      </div>

      <div className="space-y-3">
        <div className="min-h-[56px] rounded-xl border border-white/5 bg-[#0D0D0D]/60 px-4 py-3 flex flex-wrap gap-2 items-center hover:border-white/10 focus-within:border-purple-500/60 transition-colors">
          {value.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-[#00AFEF]/20 px-3 py-1 text-xs font-medium text-white"
            >
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="text-[#00AFEF] hover:text-red-400 transition-colors"
              >
                ✕
              </button>
            </span>
          ))}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={value.length === 0 ? "e.g. React, Node.js, Python..." : "Add more..."}
            className="flex-1 min-w-[120px] bg-transparent text-sm text-white placeholder:text-white/25 outline-none"
          />
        </div>

        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => addTag(s)}
                className="rounded-lg border border-[#1F1F23] bg-[#121215] px-3 py-1.5 text-xs text-gray-400 hover:border-white/10 hover:text-white transition-colors"
              >
                + {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}