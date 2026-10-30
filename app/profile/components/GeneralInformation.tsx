
import React from "react";
import InputField from "./InputField";
import TextAreaField from "./TextAreaField";
import { ProfileData, ProfileSetters } from "../types/profile";

type Props = {
  profile: Pick<
    ProfileData,
    "name" | "country" | "professionalTitle" | "bio"
  >;
  setters: Pick<
    ProfileSetters,
    "setName" | "setCountry" | "setProfessionalTitle" | "setBio"
  >;
};

export default function GeneralInformation({ profile, setters }: Props) {
  return (
    <div className="space-y-5">
      <InputField
        label="Full Name"
        placeholder="John Doe"
        value={profile.name}
        onChange={(e) => setters.setName(e.target.value)}
      />

      <InputField
        label="Professional Title"
        placeholder="Full Stack Developer"
        value={profile.professionalTitle}
        onChange={(e) => setters.setProfessionalTitle(e.target.value)}
      />

      <InputField
        label="Country"
        placeholder="Kenya"
        value={profile.country}
        onChange={(e) => setters.setCountry(e.target.value)}
      />

      <TextAreaField
        label="Bio"
        placeholder="Tell people about yourself..."
        value={profile.bio}
        onChange={(e) => setters.setBio(e.target.value)}
      />
    </div>
  );
}
