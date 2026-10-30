
type Props = {
  value: string;
  onChange: (v: string) => void;
  error?: string;
};

export default function Step7Location({ value, onChange, error }: Props) {
  const suggestions = [
    "Nairobi, Kenya",
    "Lagos, Nigeria",
    "Accra, Ghana",
    "Cape Town, South Africa",
    "Cairo, Egypt",
    "Remote",
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-foreground">
          Where are you based?
        </h2>
        <p className="text-sm text-muted">
          Let builders know where you and your project are located.
        </p>
      </div>

      <div className="space-y-2">
        <div
          className={`flex items-center gap-3 rounded-xl border bg-surface-secondary px-5 py-4 transition-colors ${
            error
              ? "border-red-500/60 focus-within:border-red-500"
              : "border-border hover:border-[#00AFEF]/50 focus-within:border-[#00AFEF]"
          }`}
        >
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="e.g. Nairobi, Kenya"
            autoFocus
            aria-invalid={!!error}
            className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted/50 outline-none"
          />
        </div>

        {error && (
          <p className="px-1 text-xs text-red-500" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onChange(suggestion)}
            aria-pressed={value === suggestion}
            className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
              value === suggestion
                ? "border-[#00AFEF] bg-[#00AFEF]/15 text-foreground"
                : "border-border bg-surface text-muted hover:border-[#00AFEF]/50 hover:text-foreground"
            }`}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
