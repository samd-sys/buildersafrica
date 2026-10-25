import { STAGE_OPTIONS } from "../../types/project";

type Props = {
  value: string;
  onChange: (v: string) => void;
  error?: string;
};

export default function Step8Stage({ value, onChange, error }: Props) {
  return (
    <div className="h-85 space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-white">
          Where is your project currently?
        </h2>
        <p className="text-sm text-gray-400">
          Be honest — every great product starts somewhere.
        </p>
      </div>

      <div className="space-y-3">
        {STAGE_OPTIONS.map((stage, index) => {
          const isSelected = value === stage.label;
          return (
            <button
              key={stage.label}
              onClick={() => onChange(stage.label)}
              className={`w-120 flex items-center gap-3 rounded-xl border p-2 text-left transition-all duration-150 ${
                isSelected
                  ? "border-white/20 bg-blue-500/10"
                  : "border-[#1F1F23] bg-[#121215] hover:border-white/10"
              }`}
            >
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-gray-600 w-4">
                  {index + 1}
                </span>
              </div>
              <div>
                <p className={`text-sm font-semibold ${isSelected ? "text-white" : "text-gray-300"}`}>
                  {stage.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{stage.description}</p>
              </div>
              <div className={`ml-auto w-4 h-4 rounded-full border-2 shrink-0 transition-colors ${
                isSelected ? "border-white/20 bg-[#00AFEF]" : "border-gray-600"
              }`} />
            </button>
          );
        })}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}