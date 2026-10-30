
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
        <h2 className="text-2xl font-bold text-foreground">
          Who are you building this for?
        </h2>
        <p className="text-sm text-muted">
          Select all that apply — you can choose multiple.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {AUDIENCE_OPTIONS.map((option) => {
          const isSelected = value.includes(option);

          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              aria-pressed={isSelected}
              className={`rounded-full border px-5 py-2.5 text-sm font-medium transition-all duration-150 ${
                isSelected
                  ? "scale-105 border-[#00AFEF] bg-[#00AFEF]/15 text-foreground"
                  : "border-border bg-surface text-muted hover:border-[#00AFEF]/50 hover:text-foreground"
              }`}
            >
              {option}
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
