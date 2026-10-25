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
        <h2 className="text-2xl font-bold text-white">
          What is your long-term vision?
        </h2>
        <p className="text-sm text-gray-400">
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
          className={`w-full resize-none rounded-xl border bg-[#0D0D0D]/60 px-5 py-4 text-white placeholder:text-white/25 outline-none transition-colors text-sm leading-relaxed ${
            error
              ? "border-white/20 focus:white/20"
              : "border-white/5 hover:border-white/10 focus:border-white/20"
          }`}
        />
        <div className="flex items-center justify-between px-1">
          {error ? (
            <p className="text-xs text-red-400">{error}</p>
          ) : (
            <span />
          )}
          <span
            className={`text-xs ${
              value.length >= MAX ? "text-red-400" : "text-gray-500"
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