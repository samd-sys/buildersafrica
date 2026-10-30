
type Props = {
  value: string;
  onChange: (v: string) => void;
  error?: string;
};

const MAX = 500;

export default function Step12Vision({ value, onChange, error }: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-foreground">
          What is your long-term vision?
        </h2>
        <p className="text-sm text-muted">
          Think big — where do you want this project to be in 5 years?
        </p>
      </div>

      <div className="space-y-2">
        <textarea
          rows={6}
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, MAX))}
          placeholder="Describe where you want this project to be in the future."
          autoFocus
          aria-invalid={!!error}
          className={`w-full resize-none rounded-xl border bg-surface-secondary px-5 py-4 text-sm leading-relaxed text-foreground placeholder:text-muted/50 outline-none transition-colors ${
            error
              ? "border-red-500/60 focus:border-red-500"
              : "border-border hover:border-[#00AFEF]/50 focus:border-[#00AFEF]"
          }`}
        />

        <div className="flex items-center justify-between px-1">
          {error ? (
            <p className="text-xs text-red-500" role="alert">
              {error}
            </p>
          ) : (
            <span />
          )}

          <span
            aria-live="polite"
            className={`text-xs ${
              value.length >= MAX ? "text-red-500" : "text-muted"
            }`}
          >
            {value.length}/{MAX}
          </span>
        </div>

        {/* AI_HOOK: Add "✨ Rewrite Vision Professionally with AI" button
            here that sends `value` to an LLM and calls onChange() with
            a polished, professional vision statement. */}
      </div>
    </div>
  );
}
