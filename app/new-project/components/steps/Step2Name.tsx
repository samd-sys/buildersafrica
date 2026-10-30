
type Props = {
  value: string;
  onChange: (v: string) => void;
  error?: string;
};

export default function Step2Name({ value, onChange, error }: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-foreground">
          What is the name of your project?
        </h2>

        <p className="text-sm text-muted">
          Choose something memorable and clear.
        </p>
      </div>

      <div className="space-y-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. BuildersAfrica"
          autoFocus
          aria-invalid={!!error}
          className={`w-full rounded-xl border bg-surface-secondary px-5 py-4 text-base text-foreground placeholder:text-muted/50 outline-none transition-colors ${
            error
              ? "border-red-500/60 focus:border-red-400"
              : "border-border hover:border-[#00AFEF]/30 focus:border-[#00AFEF]"
          }`}
        />

        {error && (
          <p className="px-1 text-xs text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
