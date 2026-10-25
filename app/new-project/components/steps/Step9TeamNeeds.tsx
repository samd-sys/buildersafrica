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
        <h2 className="text-2xl font-bold text-white">
          Who are you currently looking for?
        </h2>
        <p className="text-sm text-gray-400">
          Select all the roles you need on your team.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {TEAM_ROLES.map((role) => {
          const isSelected = value.includes(role);
          return (
            <button
              key={role}
              onClick={() => toggle(role)}
              className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-150 ${
                isSelected
                  ? "border-white/20 bg-[#00AFEF]/40 text-white scale-105"
                  : "border-[#1F1F23] bg-[#121215] text-gray-400 hover:border-white/10 hover:text-white"
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

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}