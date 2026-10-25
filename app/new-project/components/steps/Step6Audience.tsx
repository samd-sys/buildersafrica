import { AUDIENCE_OPTIONS } from "../../types/project";

type Props = {
  value: string[];
  onChange: (v: string[]) => void;
  error?: string;
};

export default function Step6Audience({ value, onChange, error }: Props) {
  const toggle = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
    } else {
      onChange([...value, option]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-white">
          Who are you building this for?
        </h2>
        <p className="text-sm text-gray-400">
          Select all that apply — you can choose multiple.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {AUDIENCE_OPTIONS.map((option) => {
          const isSelected = value.includes(option);
          return (
            <button
              key={option}
              onClick={() => toggle(option)}
              className={`rounded-full border px-5 py-2.5 text-sm font-medium transition-all duration-150 ${
                isSelected
                  ? "border-white/20 bg-[#00AFEF]/40 text-white scale-105"
                  : "border-[#1F1F23] bg-[#121215] text-gray-400 hover:border-white/10 hover:text-white"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}