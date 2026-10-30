
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
        <h2 className="text-2xl font-bold text-foreground">
          What technologies will you use?
        </h2>
        <p className="text-sm text-muted">
          Type a technology and press Enter, or pick from suggestions below.
        </p>
      </div>

      <div className="space-y-3">
        <div
          className={`flex min-h-[56px] flex-wrap items-center gap-2 rounded-xl border bg-surface-secondary px-4 py-3 transition-colors ${
            error
              ? "border-red-500/60 focus-within:border-red-500"
              : "border-border hover:border-[#00AFEF]/50 focus-within:border-[#00AFEF]"
          }`}
        >
          {value.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1.5 rounded-lg border border-[#00AFEF]/40 bg-[#00AFEF]/10 px-3 py-1 text-xs font-medium text-foreground"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                aria-label={`Remove ${tag}`}
                className="text-[#00AFEF] transition-colors hover:text-red-500"
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
            placeholder={
              value.length === 0
                ? "e.g. React, Node.js, Python..."
                : "Add more..."
            }
            aria-invalid={!!error}
            className="min-w-[120px] flex-1 bg-transparent text-sm text-foreground placeholder:text-muted/50 outline-none"
          />
        </div>

        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addTag(s)}
                className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-muted transition-colors hover:border-[#00AFEF]/50 hover:text-foreground"
              >
                + {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
