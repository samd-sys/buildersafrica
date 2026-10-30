
"use client";

import ProfilePreview from "./ProfilePreview";
import EmailSettings from "./EmailSettings";
import SecurityPrivacy from "./SecurityPrivacy";
import SupportCenter from "./SupportCenter";
import RemoveAccount from "./RemoveAccount";
import { ProfileData, ProfileSetters, RegionKey } from "../types/profile";
import {
  User,
  Mail,
  Lock,
  HelpCircle,
  Trash2,
  LogOut,
  Check,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";

type ProfileEditorProps = {
  profile: ProfileData;
  setters: ProfileSetters;
  onSave: () => void;
  onLogout: () => void;
  onAvatarFileSelected: (file: File) => Promise<void> | void;
  isSaving?: boolean;
};

const navItems = [
  { key: "profile", label: "Profile Settings", icon: User, danger: false },
  { key: "email", label: "Email Settings", icon: Mail, danger: false },
  {
    key: "security",
    label: "Security & Privacy",
    icon: Lock,
    danger: false,
  },
  {
    key: "support",
    label: "Support Center",
    icon: HelpCircle,
    danger: false,
  },
  { key: "remove", label: "Remove Account", icon: Trash2, danger: true },
] as const;

type TabKey = (typeof navItems)[number]["key"];

export default function ProfileEditor({
  profile,
  setters,
  onSave,
  onLogout,
  onAvatarFileSelected,
  isSaving = false,
}: ProfileEditorProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [showVisibilitySettings, setShowVisibilitySettings] = useState(false);

  const toggleRegion = (regionKey: RegionKey) => {
    setters.setRegions((prev) => ({
      ...prev,
      [regionKey]: !prev[regionKey],
    }));
  };

  const activeItem =
    navItems.find((item) => item.key === activeTab) ?? navItems[0];

  const isProfileTab = activeTab === "profile";

  return (
    <div
      className={`mx-auto grid h-full min-h-0 w-full max-w-7xl grid-cols-1 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-2xl border border-border bg-background md:grid-cols-[220px_minmax(0,1fr)] md:grid-rows-1 lg:grid-cols-[260px_minmax(0,1fr)] ${
        isProfileTab
          ? "lg:grid-cols-[260px_minmax(0,1fr)_360px] xl:grid-cols-[280px_minmax(0,1fr)_420px]"
          : ""
      }`}
    >
      {/* MOBILE SETTINGS NAVIGATION */}
      <div className="relative z-20 border-b border-border bg-sidebar p-3 md:hidden">
        <label
          htmlFor="profile-settings-tab"
          className="mb-2 block px-1 text-xs font-medium uppercase tracking-wider text-muted"
        >
          Settings
        </label>

        <div className="relative">
          <select
            id="profile-settings-tab"
            name="profile-settings-tab"
            value={activeTab}
            onChange={(event) =>
              setActiveTab(event.target.value as TabKey)
            }
            className={`w-full appearance-none rounded-xl border border-border bg-surface py-3 pl-3 pr-10 text-sm font-medium outline-none transition-colors focus:border-[#00AFEF] ${
              activeItem.danger ? "text-red-500" : "text-foreground"
            }`}
          >
            {navItems.map(({ key, label, danger }) => (
              <option
                key={key}
                value={key}
                className={danger ? "text-red-500" : "text-foreground"}
              >
                {label}
              </option>
            ))}
          </select>

          <ChevronDown
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
          />
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-red-500 transition-colors hover:bg-red-500/5"
        >
          <LogOut size={16} />
          Log out
        </button>
      </div>

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden min-h-0 flex-col justify-between border-r border-border bg-sidebar p-4 md:flex lg:p-5">
        <div>
          <h2 className="px-2 text-xl font-bold tracking-tight text-foreground lg:text-2xl">
            Your Profile
          </h2>

          <nav
            aria-label="Profile settings navigation"
            className="mt-7 space-y-1.5"
          >
            {navItems.map(({ key, label, icon: Icon, danger }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                aria-current={activeTab === key ? "page" : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors ${
                  activeTab === key
                    ? danger
                      ? "border-l-2 border-red-500 bg-red-500/5 pl-2.5 text-red-500"
                      : "border-l-2 border-[#00AFEF] bg-surface-secondary pl-2.5 text-foreground"
                    : danger
                      ? "text-muted hover:bg-red-500/5 hover:text-red-500"
                      : "text-muted hover:bg-surface-secondary hover:text-foreground"
                }`}
              >
                <Icon size={18} className="shrink-0 opacity-80" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="mt-8 flex shrink-0 items-center gap-2 self-start rounded-lg px-3 py-2 text-sm font-medium text-red-500/80 transition-colors hover:text-red-500"
        >
          <LogOut size={16} />
          <span>Log out</span>
        </button>
      </aside>

      {/* SETTINGS CONTENT */}
      <section
        key={activeTab}
        aria-label={activeItem.label}
        className={`min-h-0 min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain bg-background ${
          isProfileTab ? "lg:border-r lg:border-border" : ""
        }`}
      >
        {activeTab === "profile" && (
          <div className="space-y-0">
            {/* MOBILE PROFILE EDITOR */}
            <div className="border-b border-border p-4 sm:p-6 lg:hidden">
              <ProfilePreview
                profile={profile}
                setters={setters}
                onSave={onSave}
                onLogout={onLogout}
                onAvatarFileSelected={onAvatarFileSelected}
                isSaving={isSaving}
              />
            </div>

            {/* PROFILE VISIBILITY DROPDOWN HEADER */}
            <button
              type="button"
              onClick={() =>
                setShowVisibilitySettings((previous) => !previous)
              }
              aria-expanded={showVisibilitySettings}
              aria-controls="profile-visibility-settings"
              className="flex w-full items-center justify-between gap-3 px-4 py-5 text-left sm:px-6 lg:cursor-default lg:px-7"
            >
              <div>
                <h3 className="text-lg font-medium text-foreground">
                  Make your profile public
                </h3>
                <p className="mt-1 text-sm text-muted">
                  Control your profile visibility and discovery regions.
                </p>
              </div>

              <ChevronDown
                size={18}
                aria-hidden="true"
                className={`shrink-0 text-muted transition-transform lg:hidden ${
                  showVisibilitySettings ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* PROFILE VISIBILITY OPTIONS */}
            <div
              id="profile-visibility-settings"
              className={`${
                showVisibilitySettings ? "block" : "hidden"
              } lg:!block`}
            >
              <div className="space-y-6 rounded-2xl border border-border bg-surface p-4 sm:p-6">
                {/* Profile visibility toggle */}
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-medium ${
                      !profile.isPublic ? "text-foreground" : "text-muted"
                    }`}
                  >
                    Off
                  </span>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={profile.isPublic}
                    aria-label="Make profile public"
                    onClick={() =>
                      setters.setIsPublic(!profile.isPublic)
                    }
                    className={`relative h-6 w-11 shrink-0 rounded-full outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#00AFEF] focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                      profile.isPublic ? "bg-[#00AFEF]" : "bg-border"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all duration-200 ${
                        profile.isPublic ? "left-6" : "left-1"
                      }`}
                    />
                  </button>

                  <span
                    className={`text-xs font-medium ${
                      profile.isPublic ? "text-foreground" : "text-muted"
                    }`}
                  >
                    On
                  </span>
                </div>

                {/* Region selection */}
                <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2 sm:gap-4">
                  {(Object.keys(profile.regions) as RegionKey[]).map(
                    (key) => (
                      <button
                        key={key}
                        type="button"
                        disabled={!profile.isPublic}
                        aria-pressed={profile.regions[key]}
                        onClick={() => toggleRegion(key)}
                        className={`flex min-w-0 items-center gap-3 rounded-xl border p-3.5 text-left transition-all duration-150 ${
                          !profile.isPublic
                            ? "cursor-not-allowed border-border bg-transparent opacity-40"
                            : profile.regions[key]
                              ? "border-[#00AFEF] bg-[#00AFEF]/5 text-foreground"
                              : "border-border bg-surface text-muted hover:border-[#00AFEF]/50 hover:text-foreground"
                        }`}
                      >
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                            profile.regions[key]
                              ? "border-[#00AFEF] bg-[#00AFEF]"
                              : "border-muted bg-transparent"
                          }`}
                        >
                          {profile.regions[key] && (
                            <Check
                              size={12}
                              strokeWidth={3}
                              className="text-white"
                            />
                          )}
                        </span>

                        <span className="text-xs font-medium capitalize">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "email" && <EmailSettings />}

        {activeTab === "security" && <SecurityPrivacy />}

        {activeTab === "support" && <SupportCenter />}

        {activeTab === "remove" && <RemoveAccount />}
      </section>

      {/* LIVE PROFILE PREVIEW */}
      {isProfileTab && (
        <aside className="hidden min-h-0 min-w-0 flex-col overflow-y-auto overscroll-contain border-border bg-sidebar p-4 lg:flex lg:border-t-0 lg:p-5 xl:p-8">
          <ProfilePreview
            profile={profile}
            setters={setters}
            onSave={onSave}
            onLogout={onLogout}
            onAvatarFileSelected={onAvatarFileSelected}
            isSaving={isSaving}
          />
        </aside>
      )}
    </div>
  );
}
