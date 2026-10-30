
import { Dispatch, SetStateAction } from "react";
import SkillTagInput from "./SkillTagInput";

type Props = {
  skills: string[];
  setSkills: Dispatch<SetStateAction<string[]>>;
};

export default function SkillsSection({ skills, setSkills }: Props) {
  return (
    <div className="mt-6 space-y-4 border-t border-border pt-4">
      <h4 className="text-sm font-semibold uppercase tracking-wider text-muted">
        Skills
      </h4>

      <p className="-mt-2 text-xs text-muted">
        Add the skills you want recruiters and collaborators to see on
        your profile. Press Enter to add a skill.
      </p>

      <SkillTagInput skills={skills} setSkills={setSkills} />
    </div>
  );
}
