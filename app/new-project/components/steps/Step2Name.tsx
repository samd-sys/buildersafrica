type Props = {
  value: string;
  onChange: (v: string) => void;
  error?: string;
};

export default function Step2Name({ value, onChange, error }: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-white">
          What is the name of your project?
        </h2>
        <p className="text-sm text-gray-400">
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
          className={`w-full rounded-xl border bg-[#0D0D0D]/60 px-5 py-4 text-white placeholder:text-white/25 outline-none transition-colors text-base ${
            error
              ? "border-red-500/60 focus:border-red-400"
              : "border-white/5 hover:border-white/10 focus:border-white/15"
          }`}
        />
        {error && <p className="text-xs text-red-400 px-1">{error}</p>}
      </div>
    </div>
  );
}