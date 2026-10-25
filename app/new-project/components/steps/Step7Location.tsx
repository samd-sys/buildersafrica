type Props = {
  value: string;
  onChange: (v: string) => void;
  error?: string;
};

export default function Step7Location({ value, onChange, error }: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-white">
          Where are you based?
        </h2>
        <p className="text-sm text-gray-400">
          Let builders know where you and your project are located.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#0D0D0D]/60 px-5 py-4 hover:border-white/10 focus-within:border-white/20 transition-colors">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="e.g. Nairobi, Kenya"
            autoFocus
            className="flex-1 bg-transparent text-white placeholder:text-white/25 outline-none text-base"
          />
        </div>
        {error && <p className="text-xs text-red-400 px-1">{error}</p>}
      </div>

      <div className="flex flex-wrap gap-2">
        {["Nairobi, Kenya", "Lagos, Nigeria", "Accra, Ghana", "Cape Town, South Africa", "Cairo, Egypt", "Remote"].map(
          (suggestion) => (
            <button
              key={suggestion}
              onClick={() => onChange(suggestion)}
              className="rounded-full border border-[#1F1F23] bg-[#121215] px-3 py-1.5 text-xs text-gray-400 hover:border-white/10 hover:text-white transition-colors"
            >
              {suggestion}
            </button>
          )
        )}
      </div>
    </div>
  );
}