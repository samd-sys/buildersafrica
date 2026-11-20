
"use client";

import { useState } from "react";
import { Globe, ExternalLink } from "lucide-react";
import { ProfileData, ProfileSetters } from "../types/profile";
import InlineEditable from "./InlineEditable";
import AvatarUploader from "./AvatarUploader";
import SkillTagInput from "./SkillTagInput";
import Link from "next/link";
type Props = {
  profile: ProfileData;
  setters: ProfileSetters;
  onSave: () => void;
  onLogout: () => void;
  onAvatarFileSelected: (file: File) => Promise<void> | void;
  isSaving?: boolean;
};

type ProfessionalLink = {
  label: string;
  value: string;
  onSave: (value: string) => void;
  placeholder: string;
  Icon: React.ComponentType<{ size?: number }>;
  validate: (value: string) => string | null;
};

// GitHub brand icon
function GitHubIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-[18px] w-[18px]"
      aria-hidden="true"
    >
      <path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.55.1.76-.24.76-.54v-2.1c-3.1.67-3.76-1.32-3.76-1.32-.5-1.3-1.24-1.65-1.24-1.65-1.01-.69.08-.68.08-.68 1.12.08 1.71 1.15 1.71 1.15 1 1.7 2.62 1.21 3.26.93.1-.72.39-1.21.71-1.49-2.48-.28-5.09-1.24-5.09-5.52 0-1.22.44-2.22 1.15-3-.12-.28-.5-1.42.11-2.96 0 0 .94-.3 3.05 1.14a10.6 10.6 0 0 1 5.56 0c2.12-1.44 3.05-1.14 3.05-1.14.61 1.54.23 2.68.11 2.96.72.78 1.15 1.78 1.15 3 0 4.29-2.61 5.23-5.1 5.51.4.35.76 1.03.76 2.08v3.09c0 .3.2.65.77.54A11.1 11.1 0 0 0 12 .9Z" />
    </svg>
  );
}

// LinkedIn brand icon
function LinkedInIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-[18px] w-[18px]"
      aria-hidden="true"
    >
      <path d="M20.45 2H3.55C2.69 2 2 2.68 2 3.52v16.96c0 .84.69 1.52 1.55 1.52h16.9c.86 0 1.55-.68 1.55-1.52V3.52C22 2.68 21.31 2 20.45 2ZM7.93 18.4H4.97V9.37h2.96v9.03ZM6.45 8.13a1.72 1.72 0 1 1 0-3.44 1.72 1.72 0 0 1 0 3.44Zm12 10.27h-2.95V14c0-1.05-.02-2.4-1.46-2.4-1.46 0-1.68 1.14-1.68 2.32v4.48H9.41V9.37h2.83v1.23h.04c.39-.71 1.36-1.46 2.8-1.46 3 0 3.56 1.97 3.56 4.53v4.73Z" />
    </svg>
  );
}

// GitHub URL validation
const validateGitHubUrl = (value: string): string | null => {
  if (!value) return null;

  try {
    const url = new URL(value);

    if (!["http:", "https:"].includes(url.protocol)) {
      return "GitHub URL must use HTTP or HTTPS.";
    }

    if (
      !["github.com", "www.github.com"].includes(
        url.hostname.toLowerCase()
      ) ||
      !/^\/[a-zA-Z0-9-]+\/?$/.test(url.pathname)
    ) {
      return "Enter a valid GitHub profile URL (https://github.com/username).";
    }

    return null;
  } catch {
    return "Enter a valid GitHub URL starting with https://.";
  }
};

// LinkedIn URL validation
const validateLinkedInUrl = (value: string): string | null => {
  if (!value) return null;

  try {
    const url = new URL(value);

    if (!["http:", "https:"].includes(url.protocol)) {
      return "LinkedIn URL must use HTTP or HTTPS.";
    }

    if (
      !["linkedin.com", "www.linkedin.com"].includes(
        url.hostname.toLowerCase()
      ) ||
      !/^\/in\/[a-zA-Z0-9%_-]+\/?$/.test(url.pathname)
    ) {
      return "Enter a valid LinkedIn profile URL (https://www.linkedin.com/in/username).";
    }

    return null;
  } catch {
    return "Enter a valid LinkedIn URL starting with https://.";
  }
};

// Website URL validation
const validateWebsiteUrl = (value: string): string | null => {
  if (!value) return null;

  try {
    const url = new URL(value);

    if (!["http:", "https:"].includes(url.protocol)) {
      return "Website URL must start with http:// or https://.";
    }

    if (
      !url.hostname.includes(".") ||
      url.hostname.startsWith(".") ||
      url.hostname.endsWith(".")
    ) {
      return "Enter a valid website address.";
    }

    return null;
  } catch {
    return "Enter a valid website URL starting with https://.";
  }
};

export default function ProfilePreview({
  profile,
  setters,
  onSave,
  onAvatarFileSelected,
  isSaving = false,
}: Props) {
  const [isEditingSkills, setIsEditingSkills] = useState(false);

  const professionalLinks: ProfessionalLink[] = [
    {
      label: "GitHub",
      value: profile.github,
      onSave: setters.setGithub,
      placeholder: "Add your GitHub link",
      Icon: GitHubIcon,
      validate: validateGitHubUrl,
    },
    {
      label: "LinkedIn",
      value: profile.linkedin,
      onSave: setters.setLinkedin,
      placeholder: "Add your LinkedIn link",
      Icon: LinkedInIcon,
      validate: validateLinkedInUrl,
    },
    {
      label: "Website / Portfolio",
      value: profile.website,
      onSave: setters.setWebsite,
      placeholder: "Add your website or portfolio",
      Icon: Globe,
      validate: validateWebsiteUrl,
    },
  ];

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
        <div className="space-y-3 pt-2">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
              Professional Links
            </h4>

            <p className="mt-1 text-xs text-muted">
              Explore professional profiles and external work.
            </p>
          </div>

          <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
            {professionalLinks.map((link) => {
              const Icon = link.Icon;
              const hasValue = !!link.value?.trim();

              const externalUrl = link.value?.trim()
                ? /^https?:\/\//i.test(link.value.trim())
                  ? link.value.trim()
                  : `https://${link.value.trim()}`
                : "";

              return (
                <div
                  key={link.label}
                  className="flex min-w-0 items-center gap-3 p-3.5 transition-colors hover:bg-background/50 sm:p-4"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted">
                    <Icon size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground">
                      {link.label}
                    </p>

                    <div className="mt-1 min-w-0 truncate text-xs text-muted">
                      <InlineEditable
                        value={link.value}
                        onSave={link.onSave}
                        placeholder={link.placeholder}
                        validate={link.validate}
                      />
                    </div>
                  </div>

                  {hasValue && (
                    <a
                      href={externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${link.label}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-[#00AFEF]/10 hover:text-[#00AFEF]"
                    >
                      <ExternalLink size={15} />
                    </a>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-[11px] leading-relaxed text-muted">
            <span className="font-medium text-foreground">Tip:</span>{" "}
            Keep your links up to date so potential collaborators can easily
            review your work.
          </p>
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
