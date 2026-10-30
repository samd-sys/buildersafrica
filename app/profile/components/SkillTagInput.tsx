
"use client";

import { useState } from "react";

type SkillTagInputProps = {
  skills: string[];
  setSkills: React.Dispatch<React.SetStateAction<string[]>>;
};

export default function SkillTagInput({
  skills,
  setSkills,
}: SkillTagInputProps) {
  const [input, setInput] = useState("");

  const addSkill = () => {
    const trimmed = input.trim();

    if (!trimmed) return;

    if (skills.includes(trimmed)) {
      setInput("");
      return;
    }

    setSkills([...skills, trimmed]);
    setInput("");
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove));
  };

  return (
    <div className="space-y-4">
      {/* Input */}
      <input
        type="text"
        placeholder="Type a skill..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addSkill();
          }
        }}
        className="
          w-full
          rounded-xl
          border
          border-border
          bg-surface-secondary
          px-4
          py-3
          text-foreground
          placeholder:text-muted/60
          outline-none
          transition-all
          duration-200
          hover:border-[#00AFEF]/40
          focus:border-[#00AFEF]
          focus:ring-1
          focus:ring-[#00AFEF]/20
        "
      />

      {/* Skill Chips */}
      <div className="flex flex-wrap gap-3">
        {skills.map((skill, index) => (
          <div
            key={`${skill}-${index}`}
            className="
              flex
              items-center
              gap-2
              rounded-full
              border
              border-[#00AFEF]/30
              bg-[#00AFEF]/10
              px-4
              py-2
              text-sm
              font-medium
              text-[#00AFEF]
              transition-all
              duration-200
              hover:border-[#00AFEF]/60
              hover:bg-[#00AFEF]/15
            "
          >
            <span>{skill}</span>

            <button
              type="button"
              onClick={() => removeSkill(skill)}
              aria-label={`Remove ${skill}`}
              className="
                text-[#00AFEF]/70
                transition-colors
                hover:text-red-400
              "
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
