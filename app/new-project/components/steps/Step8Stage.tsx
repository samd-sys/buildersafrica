
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
        <h2 className="text-2xl font-bold text-foreground">
          Where is your project currently?
        </h2>
        <p className="text-sm text-muted">
          Be honest — every great product starts somewhere.
        </p>
      </div>

      <div className="space-y-3">
        {STAGE_OPTIONS.map((stage, index) => {
          const isSelected = value === stage.label;

          return (
            <button
              key={stage.label}
              type="button"
              onClick={() => onChange(stage.label)}
              aria-pressed={isSelected}
              className={`flex w-full items-center gap-3 rounded-xl border p-2 text-left transition-all duration-150 ${
                isSelected
                  ? "border-[#00AFEF] bg-[#00AFEF]/10"
                  : "border-border bg-surface hover:border-[#00AFEF]/50"
              }`}
            >
              <div className="flex shrink-0 items-center gap-2">
                <span className="w-4 text-xs font-bold text-muted">
                  {index + 1}
                </span>
              </div>

              <div>
                <p
                  className={`text-sm font-semibold ${
                    isSelected ? "text-foreground" : "text-foreground/80"
                  }`}
                >
                  {stage.label}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {stage.description}
                </p>
              </div>

              <div
                className={`ml-auto h-4 w-4 shrink-0 rounded-full border-2 transition-colors ${
                  isSelected
                    ? "border-[#00AFEF] bg-[#00AFEF]"
                    : "border-border"
                }`}
              />
            </button>
          );
        })}
      </div>

      {error && (
        <p className="text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
