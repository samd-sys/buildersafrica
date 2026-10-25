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
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <span className="text-xs font-medium text-gray-400 tracking-wide uppercase italic">
          (Click any element to edit it)
        </span>
      </div>

      {/* Scrollable profile content */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 -mr-1 space-y-5 pt-4">
        <AvatarUploader
          avatarUrl={profile.avatarUrl}
          name={profile.name}
          onFileSelected={onAvatarFileSelected}
        />

        {/* Identity block */}
        <div className="space-y-1">
          <h3 className="text-2xl font-bold tracking-tight text-white">
            <InlineEditable
              value={profile.name}
              onSave={setters.setName}
              placeholder="Your Name"
              inputClassName="text-2xl font-bold tracking-tight"
            />
          </h3>
          <p className="text-sm font-medium text-[#3B82F6]">
            <InlineEditable
              value={profile.professionalTitle}
              onSave={setters.setProfessionalTitle}
              placeholder="Professional Title"
              inputClassName="text-sm font-medium"
            />
          </p>
          <p className="text-xs text-gray-400">
            <InlineEditable
              value={profile.country}
              onSave={setters.setCountry}
              placeholder="Country / Location"
              inputClassName="text-xs"
            />
          </p>
        </div>

        {/* bio box */}
        <div className="bg-[#121215] border border-[#1F1F23] rounded-xl p-4 hover:border-white/10 transition-colors">
          <p className="text-xs leading-relaxed text-gray-300">
            <span className="font-bold text-[#3B82F6] mr-1.5">Bio:</span>
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
          <h4 className="text-xs font-semibold text-gray-400 tracking-wider uppercase">
            Top Skill
          </h4>
          <div className="bg-[#121215] border border-[#1F1F23] rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-white">
              {profile.professionalTitle || "Top Skill"}
            </p>

            {isEditingSkills ? (
              <div className="space-y-2">
                <SkillTagInput
                  skills={profile.skills}
                  setSkills={setters.setSkills}
                />
                <button
                  onClick={() => setIsEditingSkills(false)}
                  className="text-[11px] font-semibold text-[#3B82F6] hover:text-[#6366F1] transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <div
                onClick={() => setIsEditingSkills(true)}
                className="flex flex-wrap gap-1.5 cursor-pointer rounded-lg -mx-1 px-1 py-0.5 hover:bg-white/[0.04] transition-colors"
                title="Click to edit skills"
              >
                {profile.skills && profile.skills.length > 0 ? (
                  profile.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[11px] font-medium text-gray-300"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-white/30 italic">
                    Click to add skills...
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Professional links */}
        <div className="space-y-2 pt-1">
          <h4 className="text-xs font-semibold text-gray-400 tracking-wider uppercase">
            Links
          </h4>
          <div className="bg-[#121215] border border-[#1F1F23] rounded-xl p-4 space-y-2 text-xs text-gray-400">
            <p className="truncate">
              <span className="text-white/50 font-medium mr-1">
                GitHub:
              </span>
              <InlineEditable
                value={profile.github}
                onSave={setters.setGithub}
                placeholder="Add your GitHub link"
              />
            </p>
            <p className="truncate">
              <span className="text-white/50 font-medium mr-1">
                LinkedIn:
              </span>
              <InlineEditable
                value={profile.linkedin}
                onSave={setters.setLinkedin}
                placeholder="Add your LinkedIn link"
              />
            </p>
            <p className="truncate">
              <span className="text-white/50 font-medium mr-1">
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
      <div className="pt-6 border-t border-[#1F1F23]/60 mt-4 shrink-0">
        <button
          onClick={onSave}
          disabled={isSaving}
          className="w-full rounded-xl bg-[#5E5CE6]/40 hover:bg-[#4A49D1] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed py-3.5 text-sm font-semibold text-white tracking-wide transition-all shadow-lg shadow-[#5E5CE6]/10 flex items-center justify-center gap-2"
        >
          <span>{isSaving ? "Saving..." : "Save & Exit"}</span>
        </button>
      </div>
    </div>
  );
}