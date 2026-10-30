
type Props = {
  value: string;
  onChange: (v: string) => void;
  error?: string;
};

const MAX = 200;

export default function Step3Description({ value, onChange, error }: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-foreground">
          Describe your project in one sentence.
        </h2>

        <p className="text-sm text-muted">
          Keep it short and compelling — this is your project's elevator pitch.
        </p>
      </div>

      <div className="space-y-2">
        <textarea
          rows={4}
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, MAX))}
          placeholder="A platform connecting African founders with developers and investors."
          autoFocus
          aria-invalid={!!error}
          className={`w-full resize-none rounded-xl border bg-surface-secondary px-5 py-4 text-sm leading-relaxed text-foreground placeholder:text-muted/50 outline-none transition-colors ${
            error
              ? "border-red-500/60 focus:border-red-400"
              : "border-border hover:border-[#00AFEF]/30 focus:border-[#00AFEF]"
          }`}
        />

        <div className="flex items-center justify-between px-1">
          {error ? (
            <p className="text-xs text-red-400" role="alert">
              {error}
            </p>
          ) : (
            <span />
          )}

          <span
            className={`text-xs ${
              value.length >= MAX ? "text-red-400" : "text-muted"
            }`}
            aria-live="polite"
          >
            {value.length}/{MAX}
          </span>
        </div>

        {/* AI_HOOK: Add "✨ Improve with AI" button here that sends
            `value` to an LLM endpoint and calls onChange() with the
            improved description. */}
      </div>
    </div>
  );
}
