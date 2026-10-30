
type Props = {
  value: string;
  onChange: (v: string) => void;
  error?: string;
};

export default function Step5Problem({ value, onChange, error }: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-foreground">
          What problem does your project solve?
        </h2>
        <p className="text-sm text-muted">
          Be specific — the clearer the problem, the stronger the solution.
        </p>
      </div>

      <div className="space-y-2">
        <textarea
          rows={5}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Describe the problem your project aims to solve."
          autoFocus
          aria-invalid={!!error}
          className={`w-full resize-none rounded-xl border bg-surface-secondary px-5 py-4 text-sm leading-relaxed text-foreground placeholder:text-muted/50 outline-none transition-colors ${
            error
              ? "border-red-500/60 focus:border-red-500"
              : "border-border hover:border-[#00AFEF]/50 focus:border-[#00AFEF]"
          }`}
        />

        {error && (
          <p className="px-1 text-xs text-red-500" role="alert">
            {error}
          </p>
        )}

        {/* AI_HOOK: Add "✨ Refine Problem Statement with AI" button here
            that sends `value` to an LLM and calls onChange() with a
            cleaner, more compelling problem statement. */}
      </div>
    </div>
  );
}
