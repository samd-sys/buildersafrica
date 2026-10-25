"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Mail, Check, AlertCircle } from "lucide-react";

type EmailNotifications = {
  application_updates: boolean;
  team_invitations: boolean;
  new_messages: boolean;
  connection_requests: boolean;
  platform_announcements: boolean;
};

const NOTIFICATION_LABELS: Record<keyof EmailNotifications, { label: string; description: string }> = {
  application_updates:    { label: "Application Updates",    description: "Get notified when your applications are accepted or rejected." },
  team_invitations:       { label: "Team Invitations",       description: "Get notified when a founder invites you to join their project team." },
  new_messages:           { label: "New Messages",           description: "Get notified when you receive a new direct message or message request." },
  connection_requests:    { label: "Connection Requests",    description: "Get notified when someone sends you a connection request." },
  platform_announcements: { label: "Platform Announcements", description: "Receive updates about new features and important BuildersAfrica news." },
};

const DEFAULT_PREFS: EmailNotifications = {
  application_updates: true, team_invitations: true, new_messages: true,
  connection_requests: true, platform_announcements: true,
};

export default function EmailSettings() {
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail,     setNewEmail]     = useState("");
  const [emailStatus,  setEmailStatus]  = useState<"idle"|"loading"|"success"|"error">("idle");
  const [emailError,   setEmailError]   = useState("");
  const [prefs,        setPrefs]        = useState<EmailNotifications>(DEFAULT_PREFS);
  const [savingPrefs,  setSavingPrefs]  = useState(false);
  const [prefsSaved,   setPrefsSaved]   = useState(false);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setCurrentEmail(user.email || "");
    const { data: profile } = await supabase
      .from("profiles").select("email_notifications").eq("user_id", user.id).single();
    if (profile?.email_notifications) setPrefs({ ...DEFAULT_PREFS, ...profile.email_notifications });
    setLoading(false);
  };

  const handleEmailChange = async () => {
    if (!newEmail.trim()) { setEmailError("Please enter a new email address."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) { setEmailError("Please enter a valid email address."); return; }
    if (newEmail === currentEmail) { setEmailError("This is already your current email address."); return; }
    setEmailStatus("loading"); setEmailError("");
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) { setEmailError("Failed to update email. Please try again."); setEmailStatus("error"); }
    else { setEmailStatus("success"); setNewEmail(""); }
  };

  const handlePrefToggle = async (key: keyof EmailNotifications) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated); setSavingPrefs(true); setPrefsSaved(false);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from("profiles").update({ email_notifications: updated }).eq("user_id", user.id);
    setSavingPrefs(false); setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 2000);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={24} className="animate-spin text-[#00AFEF]" /></div>;

  return (
    <div className="space-y-8 p-8">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-white">Email Settings</h2>
        <p className="text-sm text-gray-400">Manage your email address and notification preferences.</p>
      </div>

      {/* Change Email */}
      <div className="rounded-2xl border border-[#1F1F23] bg-[#121215] p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Mail size={16} className="text-[#00AFEF]" />
          <h3 className="text-sm font-semibold text-white">Email Address</h3>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-gray-500">Current email</label>
          <div className="rounded-xl border border-[#1F1F23] bg-[#0F0F11] px-4 py-3 text-sm text-gray-400">{currentEmail || "—"}</div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-gray-500">New email address</label>
          <input type="email" value={newEmail}
            onChange={(e) => { setNewEmail(e.target.value); setEmailError(""); setEmailStatus("idle"); }}
            placeholder="Enter new email address"
            className="w-full rounded-xl border border-[#1F1F23] bg-[#0F0F11] px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-[#00AFEF]/50 transition-colors"
          />
          {emailError && <p className="flex items-center gap-1.5 text-xs text-red-400"><AlertCircle size={12} />{emailError}</p>}
          {emailStatus === "success" && <p className="flex items-center gap-1.5 text-xs text-emerald-400"><Check size={12} />Confirmation email sent. Check your inbox to verify the new address.</p>}
        </div>
        <button onClick={handleEmailChange} disabled={emailStatus === "loading" || !newEmail.trim()}
          className="flex items-center gap-2 rounded-xl bg-[#00AFEF] px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-[#00AFEF]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {emailStatus === "loading" ? <><Loader2 size={14} className="animate-spin" />Updating...</> : "Update Email"}
        </button>
      </div>

      {/* Notification Preferences */}
      <div className="rounded-2xl border border-[#1F1F23] bg-[#121215] p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Email Notifications</h3>
          {savingPrefs && <span className="flex items-center gap-1.5 text-xs text-gray-500"><Loader2 size={11} className="animate-spin" />Saving...</span>}
          {prefsSaved  && <span className="flex items-center gap-1.5 text-xs text-emerald-400"><Check size={11} />Saved</span>}
        </div>
        <div className="space-y-5">
          {(Object.keys(NOTIFICATION_LABELS) as (keyof EmailNotifications)[]).map((key) => {
            const { label, description } = NOTIFICATION_LABELS[key];
            return (
              <div key={key} className="flex items-start justify-between gap-4">
                <div className="space-y-0.5 flex-1">
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p className="text-xs text-gray-500">{description}</p>
                </div>
                <button onClick={() => handlePrefToggle(key)}
                  className={`w-11 h-6 rounded-full transition-colors relative duration-200 outline-none shrink-0 mt-0.5 ${prefs[key] ? "bg-[#00AFEF]" : "bg-[#27272A]"}`}>
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all duration-200 ${prefs[key] ? "left-6" : "left-1"}`} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}