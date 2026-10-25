import React from "react";
import InputField from "./InputField";
import { ProfileData, ProfileSetters } from "../types/profile";

type Props = {
  profile: Pick<
    ProfileData,
    "github" | "linkedin" | "website"
  >;
  setters: Pick<
    ProfileSetters,
    "setGithub" | "setLinkedin" | "setWebsite"
  >;
};

export default function ProfessionalLinks({ profile, setters }: Props) {
  return (
    <div className="space-y-5 pt-4 border-t border-white/5 mt-6">
      <h4 className="text-sm font-semibold text-white/60 tracking-wider uppercase">
        Online Handlers
      </h4>

      <InputField
        label="GitHub"
        placeholder="https://github.com/username"
        value={profile.github}
        helperText="Link to your code workspace profiles."
        onChange={(e) => setters.setGithub(e.target.value)}
      />

      <InputField
        label="LinkedIn"
        placeholder="https://linkedin.com/in/username"
        value={profile.linkedin}
        helperText="Link to your professional corporate background network map."
        onChange={(e) => setters.setLinkedin(e.target.value)}
      />

      <InputField
        label="Website"
        placeholder="https://yourwebsite.com"
        value={profile.website}
        helperText="Link to your custom active domains or personal web profile pages."
        onChange={(e) => setters.setWebsite(e.target.value)}
      />
    </div>
  );
}