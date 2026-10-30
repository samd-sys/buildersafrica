
"use client";

import { useState } from "react";
import { ProfileData, ProfileSetters } from "../types/profile";
import InlineEditable from "./InlineEditable";
import AvatarUploader from "./AvatarUploader";
import SkillTagInput from "./SkillTagInput";

type Props = {
  profile: ProfileData;
  setters: ProfileSetters;
  onSave: () => void;
  onLogout: () => void;
  onAvatarFileSelected: (file: File) => Promise<void> | void;
  isSaving?: boolean;
};

export default function ProfilePreview({
  profile,
  setters,
  onSave,
  onAvatarFileSelected,
  isSaving = false,
}: Props) {
  const [isEditingSkills, setIsEditingSkills] = useState(false);

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between">
        <span className="text-xs font-medium uppercase italic tracking-wide text-muted">
          (Click any element to edit it)
        </span>
      </div>

      {/* Scrollable profile content */}
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1 -mr-1 pt-4">
        <AvatarUploader
          avatarUrl={profile.avatarUrl}
          name={profile.name}
          onFileSelected={onAvatarFileSelected}
        />

        {/* Identity block */}
        <div className="space-y-1">
          <h3 className="text-2xl font-bold tracking-tight text-foreground">
            <InlineEditable
              value={profile.name}
              onSave={setters.setName}
              placeholder="Your Name"
              inputClassName="text-2xl font-bold tracking-tight"
            />
          </h3>

          <p className="text-sm font-medium text-[#00AFEF]">
            <InlineEditable
              value={profile.professionalTitle}
              onSave={setters.setProfessionalTitle}
              placeholder="Professional Title"
              inputClassName="text-sm font-medium"
            />
          </p>

          <p className="text-xs text-muted">
            <InlineEditable
              value={profile.country}
              onSave={setters.setCountry}
              placeholder="Country / Location"
              inputClassName="text-xs"
            />
          </p>
        </div>

        {/* Bio box */}
        <div className="rounded-xl border border-border bg-surface p-4 transition-colors hover:border-[#00AFEF]/30">
          <p className="text-xs leading-relaxed text-foreground">
            <span className="mr-1.5 font-bold text-[#00AFEF]">
              Bio:
            </span>
            <InlineEditable
              value={profile.bio}
              onSave={setters.setBio}
              as="textarea"
              rows={6}
              placeholder="Tell the community about yourself..."
              inputClassName="text-xs leading-relaxed"
            />
          </p>
        </div>

        {/* Top Skill */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
            Top Skill
          </h4>

          <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
            <p className="text-xs font-bold text-foreground">
              {profile.professionalTitle || "Top Skill"}
            </p>

            {isEditingSkills ? (
              <div className="space-y-2">
                <SkillTagInput
                  skills={profile.skills}
                  setSkills={setters.setSkills}
                />

                <button
                  type="button"
                  onClick={() => setIsEditingSkills(false)}
                  className="text-[11px] font-semibold text-[#00AFEF] transition-colors hover:opacity-75"
                >
                  Done
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingSkills(true)}
                aria-label="Edit profile skills"
                className="flex w-full flex-wrap gap-1.5 rounded-lg -mx-1 px-1 py-0.5 text-left transition-colors hover:bg-surface-secondary"
                title="Click to edit skills"
              >
                {profile.skills && profile.skills.length > 0 ? (
                  profile.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded border border-border bg-surface-secondary px-2 py-0.5 text-[11px] font-medium text-foreground"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-xs italic text-muted">
                    Click to add skills...
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Professional links */}
        <div className="space-y-2 pt-1">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
            Links
          </h4>

          <div className="space-y-2 rounded-xl border border-border bg-surface p-4 text-xs text-muted">
            <p className="truncate">
              <span className="mr-1 font-medium text-foreground">
                GitHub:
              </span>
              <InlineEditable
                value={profile.github}
                onSave={setters.setGithub}
                placeholder="Add your GitHub link"
              />
            </p>

            <p className="truncate">
              <span className="mr-1 font-medium text-foreground">
                LinkedIn:
              </span>
              <InlineEditable
                value={profile.linkedin}
                onSave={setters.setLinkedin}
                placeholder="Add your LinkedIn link"
              />
            </p>

            <p className="truncate">
              <span className="mr-1 font-medium text-foreground">
                Website:
              </span>
              <InlineEditable
                value={profile.website}
                onSave={setters.setWebsite}
                placeholder="Add your website link"
              />
            </p>
          </div>
        </div>
      </div>

      {/* Save & Exit — pinned */}
      <div className="mt-4 shrink-0 border-t border-border pt-6">
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#00AFEF] py-3.5 text-sm font-semibold tracking-wide text-white shadow-lg shadow-[#00AFEF]/10 transition-all hover:bg-[#009BD5] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span>{isSaving ? "Saving..." : "Save & Exit"}</span>
        </button>
      </div>
    </div>
  );
}
