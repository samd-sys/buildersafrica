import { Dispatch, SetStateAction } from "react";
import SkillTagInput from "./SkillTagInput";

type Props = {
  skills: string[];
  setSkills: Dispatch<SetStateAction<string[]>>;
};

export default function SkillsSection({ skills, setSkills }: Props) {
  return (
    <div className="space-y-4 pt-4 border-t border-white/5 mt-6">
      <h4 className="text-sm font-semibold text-white/60 tracking-wider uppercase">
        Skills
      </h4>
      <p className="text-xs text-gray-400 -mt-2">
        Add the skills you want recruiters and collaborators to see on
        your profile. Press Enter to add a skill.
      </p>
      <SkillTagInput skills={skills} setSkills={setSkills} />
    </div>
  );
}