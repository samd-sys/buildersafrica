
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
        <h2 className="text-2xl font-bold text-foreground">
          What type of project are you building?
        </h2>
        <p className="text-sm text-muted">
          Select the category that best fits.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {CATEGORIES.map((cat) => {
          const isSelected = value === cat.label;

          return (
            <button
              key={cat.label}
              type="button"
              onClick={() => onChange(cat.label)}
              aria-pressed={isSelected}
              className={`flex flex-col items-center gap-3 rounded-xl border p-2 text-center transition-all duration-150 ${
                isSelected
                  ? "border-[#00AFEF] bg-[#00AFEF]/15 text-foreground"
                  : "border-border bg-surface text-muted hover:border-[#00AFEF]/50 hover:text-foreground"
              }`}
            >
              <span className="text-xs font-medium leading-tight">
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="px-1 text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
