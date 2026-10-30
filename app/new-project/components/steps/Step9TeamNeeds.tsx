
import { TEAM_ROLES } from "../../types/project";

type Props = {
  value: string[];
  onChange: (v: string[]) => void;
  error?: string;
};

export default function Step9TeamNeeds({ value, onChange, error }: Props) {
  const toggle = (role: string) => {
    if (value.includes(role)) {
      onChange(value.filter((v) => v !== role));
    } else {
      onChange([...value, role]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-foreground">
          Who are you currently looking for?
        </h2>
        <p className="text-sm text-muted">
          Select all the roles you need on your team.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {TEAM_ROLES.map((role) => {
          const isSelected = value.includes(role);

          return (
            <button
              key={role}
              type="button"
              onClick={() => toggle(role)}
              aria-pressed={isSelected}
              className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-150 ${
                isSelected
                  ? "scale-105 border-[#00AFEF] bg-[#00AFEF]/15 text-foreground"
                  : "border-border bg-surface text-muted hover:border-[#00AFEF]/50 hover:text-foreground"
              }`}
            >
              {role}
            </button>
          );
        })}
      </div>

      {/* AI_HOOK: Add "✨ Suggest Team Roles with AI" button here that
          analyses the project description and problem statement and
          calls onChange() with recommended roles. */}

      {error && (
        <p className="text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
