import { CATEGORIES } from "../../types/project";

type Props = {
  value: string;
  onChange: (v: string) => void;
  error?: string;
};

export default function Step4Category({ value, onChange, error }: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-white">
          What type of project are you building?
        </h2>
        <p className="text-sm text-gray-400">Select the category that best fits.</p>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {CATEGORIES.map((cat) => {
          const isSelected = value === cat.label;
          return (
            <button
              key={cat.label}
              onClick={() => onChange(cat.label)}
              className={`flex flex-col items-center gap-3 rounded-xl border p-2 text-center transition-all duration-150 ${
                isSelected
                  ? "border-white/20 bg-[#00AFEF]/40 text-white"
                  : "border-[#1F1F23] bg-[#121215] text-gray-400 hover:border-white/10 hover:text-white"
              }`}
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className="text-xs font-medium leading-tight">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {error && <p className="text-xs text-red-400 px-1">{error}</p>}
    </div>
  );
}