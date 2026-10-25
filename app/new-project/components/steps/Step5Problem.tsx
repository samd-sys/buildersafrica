type Props = {
  value: string;
  onChange: (v: string) => void;
  error?: string;
};

export default function Step5Problem({ value, onChange, error }: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-white">
          What problem does your project solve?
        </h2>
        <p className="text-sm text-gray-400">
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
          className={`w-full resize-none rounded-xl border bg-[#0D0D0D]/60 px-5 py-4 text-white placeholder:text-white/25 outline-none transition-colors text-sm leading-relaxed ${
            error
              ? "border-red-500/60 focus:border-red-400"
              : "border-white/5 hover:border-white/10 focus:border-white/20"
          }`}
        />
        {error && <p className="text-xs text-red-400 px-1">{error}</p>}

        {/* AI_HOOK: Add "✨ Refine Problem Statement with AI" button here
            that sends `value` to an LLM and calls onChange() with a
            cleaner, more compelling problem statement. */}
      </div>
    </div>
  );
}