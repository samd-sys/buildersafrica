
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
    <section className="mt-6 w-full min-w-0 border-t border-border pt-5 sm:mt-8 sm:pt-6">
      <div className="mb-5 min-w-0">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted sm:text-sm">
          Professional Links
        </h4>

        <p className="mt-1 text-xs leading-relaxed text-muted sm:text-sm">
          Add your professional profiles and portfolio to help others learn
          more about your work.
        </p>
      </div>

      <div className="grid w-full min-w-0 grid-cols-1 gap-5">
        <div className="min-w-0">
          <InputField
            label="GitHub"
            placeholder="https://github.com/username"
            value={profile.github}
            helperText="Link to your code workspace profile."
            onChange={(e) => setters.setGithub(e.target.value)}
          />
        </div>

        <div className="min-w-0">
          <InputField
            label="LinkedIn"
            placeholder="https://linkedin.com/in/username"
            value={profile.linkedin}
            helperText="Link to your professional LinkedIn profile."
            onChange={(e) => setters.setLinkedin(e.target.value)}
          />
        </div>

        <div className="min-w-0">
          <InputField
            label="Website / Portfolio"
            placeholder="https://yourwebsite.com"
            value={profile.website}
            helperText="Link to your personal website or portfolio."
            onChange={(e) => setters.setWebsite(e.target.value)}
          />
        </div>
      </div>
    </section>
  );
}
