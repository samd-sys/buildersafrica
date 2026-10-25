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
  setSkills(
    skills.filter((skill) => skill !== skillToRemove)
  );
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
          border-white/10
          bg-white/5
          px-4
          py-3
          text-white
          placeholder:text-white/30
          outline-none
          transition-all
          duration-200
          hover:border-white/20
          focus:border-cyan-400
        "
      />

      {/* Skill Chips */}
      <div className="flex flex-wrap gap-3">
        {skills.map((skill, index) => (
          <div
            key={index}
className="
  flex
  items-center
  gap-2
  rounded-full
  border
  border-cyan-500/30
  bg-cyan-500/10
  px-4
  py-2
  text-sm
  font-medium
  text-cyan-100
  transition-all
  duration-200
  hover:border-cyan-400
  hover:bg-cyan-500/20
"   
          >
            <span>{skill}</span>

            <button
              type="button"
              onClick={() => removeSkill(skill)}
              className="
              text-cyan-300
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