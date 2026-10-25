import GeneralInformation from "./GeneralInformation";
import ProfessionalLinks from "./ProfessionalLinks";
import SkillsSection from "./SkillsSection";
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

export default function ProfileEditor({
  profile,
  setters,
  onSave,
  onLogout,
  onAvatarFileSelected,
  isSaving = false,
}: ProfileEditorProps) {
  const [activeTab, setActiveTab] = useState("profile");

  const toggleRegion = (regionKey: RegionKey) => {
    setters.setRegions((prev) => ({
      ...prev,
      [regionKey]: !prev[regionKey],
    }));
  };

  const navItems = [
    { key: "profile",  label: "Profile Settings", icon: User,        danger: false },
    { key: "email",    label: "Email Settings",    icon: Mail,        danger: false },
    { key: "security", label: "Security & Privacy",icon: Lock,        danger: false },
    { key: "support",  label: "Support Center",    icon: HelpCircle,  danger: false },
    { key: "remove",   label: "Remove Account",    icon: Trash2,      danger: true  },
  ];

  const isProfileTab = activeTab === "profile";

  return (
    <div className={`w-full max-w-7xl mx-auto h-full bg-[#0F0F11] border border-[#1F1F23] rounded-[24px] overflow-hidden grid grid-rows-1 grid-cols-1 ${
      isProfileTab
        ? "md:grid-cols-[260px_1fr] lg:grid-cols-[280px_1fr_420px]"
        : "md:grid-cols-[260px_1fr] lg:grid-cols-[280px_1fr]"
    }`}>

      {/* ── PANEL 1: LEFT NAVIGATION ─────────────────────────────────────── */}
      <div className="bg-[#0C0C0E] border-r border-[#1F1F23] p-6 flex flex-col justify-between overflow-hidden">
        <div className="space-y-8">
          <h2 className="text-2xl font-bold tracking-tight px-2 text-white">
            Your Profile
          </h2>

          <nav className="space-y-1.5">
            {navItems.map(({ key, label, icon: Icon, danger }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === key
                    ? danger
                      ? "bg-red-500/[0.06] text-red-400 border-l-2 border-red-400 pl-2.5"
                      : "bg-white/[0.04] text-white border-l-2 border-white/60 pl-2.5"
                    : danger
                    ? "text-gray-400 hover:text-red-400 hover:bg-red-500/[0.02]"
                    : "text-gray-400 hover:text-white hover:bg-white/[0.02]"
                }`}
              >
                <Icon size={18} className="opacity-80 shrink-0" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-500/80 hover:text-red-400 transition-colors self-start mt-8"
        >
          <LogOut size={16} />
          <span>Log out</span>
        </button>
      </div>

      {/* ── PANEL 2: CENTER CONTENT ───────────────────────────────────────── */}
      <div className={`h-full overflow-y-auto bg-[#0C0C0E] ${isProfileTab ? "border-r border-[#1F1F23]/40" : ""}`}>

        {/* Profile Settings tab */}
        {activeTab === "profile" && (
          <div className="space-y-0">
            <div>
              <h3 className="text-xl font-medium text-white p-7 mb-1">
                Make your profile public
              </h3>
            </div>

            {/* Visibility controls */}
            <div className="bg-[#0C0C0E] border border-[#0C0C0E] rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-xs font-medium transition-colors ${!profile.isPublic ? "text-white" : "text-gray-500"}`}>
                  Off
                </span>
                <button
                  onClick={() => setters.setIsPublic(!profile.isPublic)}
                  className={`w-11 h-6 rounded-full transition-colors relative duration-200 outline-none ${
                    profile.isPublic ? "bg-[#00AFEF]" : "bg-[#27272A]"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all duration-200 ${
                    profile.isPublic ? "left-6" : "left-1"
                  }`} />
                </button>
                <span className={`text-xs font-medium transition-colors ${profile.isPublic ? "text-white" : "text-gray-500"}`}>
                  On
                </span>
              </div>

              {/* Region selection grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {(Object.keys(profile.regions) as RegionKey[]).map((key) => (
                  <button
                    key={key}
                    disabled={!profile.isPublic}
                    onClick={() => toggleRegion(key)}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-150 ${
                      !profile.isPublic
                        ? "opacity-30 cursor-not-allowed border-[#1F1F23] bg-transparent"
                        : profile.regions[key]
                        ? "border-[#00AFEF] bg-[#00AFEF]/[0.03] text-white"
                        : "border-[#1F1F23] bg-transparent text-gray-400 hover:border-white/10 hover:text-white"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                      profile.regions[key]
                        ? "border-[#00AFEF] bg-[#00AFEF]"
                        : "border-gray-600 bg-transparent"
                    }`}>
                      {profile.regions[key] && (
                        <Check size={12} strokeWidth={3} className="text-white" />
                      )}
                    </div>
                    <span className="text-xs font-medium capitalize">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Email Settings tab */}
        {activeTab === "email" && <EmailSettings />}

        {/* Security & Privacy tab */}
        {activeTab === "security" && <SecurityPrivacy />}

        {/* Support Center tab */}
        {activeTab === "support" && <SupportCenter />}

        {/* Remove Account tab */}
        {activeTab === "remove" && <RemoveAccount />}
      </div>

      {/* ── PANEL 3: LIVE PREVIEW — only shown on profile tab ───────────── */}
      {isProfileTab && (
        <div className="h-full bg-[#0B0B0D] p-6 lg:p-8 flex flex-col overflow-hidden border-t md:border-t-0 md:col-span-2 lg:col-span-1 border-[#1F1F23]">
          <ProfilePreview
            profile={profile}
            setters={setters}
            onSave={onSave}
            onLogout={onLogout}
            onAvatarFileSelected={onAvatarFileSelected}
            isSaving={isSaving}
          />
        </div>
      )}
    </div>
  );
}