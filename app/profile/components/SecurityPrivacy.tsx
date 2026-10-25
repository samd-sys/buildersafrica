"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Lock, Eye, EyeOff, Check, AlertCircle, Shield } from "lucide-react";

export default function SecurityPrivacy() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent,     setShowCurrent]     = useState(false);
  const [showNew,         setShowNew]         = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [pwStatus,        setPwStatus]        = useState<"idle"|"loading"|"success"|"error">("idle");
  const [pwError,         setPwError]         = useState("");
  const [hideEmail,       setHideEmail]       = useState(false);
  const [savingPrivacy,   setSavingPrivacy]   = useState(false);
  const [privacySaved,    setPrivacySaved]    = useState(false);
  const [loading,         setLoading]         = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data: profile } = await supabase.from("profiles").select("hide_email").eq("user_id", user.id).single();
    if (profile) setHideEmail(profile.hide_email ?? false);
    setLoading(false);
  };

  const getStrength = (pw: string) => {
    if (!pw) return { label: "", color: "", width: "0%" };
    let s = 0;
    if (pw.length >= 12) s++; if (pw.length >= 16) s++;
    if (/[A-Z]/.test(pw)) s++; if (/[0-9]/.test(pw)) s++; if (/[^A-Za-z0-9]/.test(pw)) s++;
    if (s <= 1) return { label: "Weak",   color: "bg-red-500",    width: "25%"  };
    if (s === 2) return { label: "Fair",   color: "bg-orange-400", width: "50%"  };
    if (s === 3) return { label: "Good",   color: "bg-yellow-400", width: "75%"  };
    return              { label: "Strong", color: "bg-[#00AFEF]",  width: "100%" };
  };

  const strength = getStrength(newPassword);

  const handlePasswordChange = async () => {
    setPwError("");
    if (!newPassword || newPassword.length < 12) { setPwError("Password must be at least 12 characters."); return; }
    if (newPassword !== confirmPassword) { setPwError("Passwords do not match."); return; }
    setPwStatus("loading");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) { setPwError("Could not verify your session."); setPwStatus("error"); return; }
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
    if (signInError) { setPwError("Current password is incorrect."); setPwStatus("error"); return; }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { setPwError("Failed to update password. Please try again."); setPwStatus("error"); }
    else { setPwStatus("success"); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }
  };

  const handleHideEmailToggle = async () => {
    const updated = !hideEmail;
    setHideEmail(updated); setSavingPrivacy(true); setPrivacySaved(false);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from("profiles").update({ hide_email: updated }).eq("user_id", user.id);
    setSavingPrivacy(false); setPrivacySaved(true);
    setTimeout(() => setPrivacySaved(false), 2000);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={24} className="animate-spin text-[#00AFEF]" /></div>;

  return (
    <div className="space-y-8 p-8">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-white">Security & Privacy</h2>
        <p className="text-sm text-gray-400">Manage your password and control your privacy settings.</p>
      </div>

      {/* Change Password */}
      <div className="rounded-2xl border border-[#1F1F23] bg-[#121215] p-6 space-y-5">
        <div className="flex items-center gap-2"><Lock size={16} className="text-[#00AFEF]" /><h3 className="text-sm font-semibold text-white">Change Password</h3></div>

        {[
          { label: "Current password", value: currentPassword, set: setCurrentPassword, show: showCurrent, toggle: () => setShowCurrent(v => !v), placeholder: "Enter current password" },
          { label: "New password",     value: newPassword,     set: setNewPassword,     show: showNew,     toggle: () => setShowNew(v => !v),     placeholder: "Min. 12 characters"   },
          { label: "Confirm new password", value: confirmPassword, set: setConfirmPassword, show: showConfirm, toggle: () => setShowConfirm(v => !v), placeholder: "Repeat new password" },
        ].map(({ label, value, set, show, toggle, placeholder }) => (
          <div key={label} className="space-y-1.5">
            <label className="text-xs text-gray-500">{label}</label>
            <div className="relative">
              <input type={show ? "text" : "password"} value={value}
                onChange={(e) => { set(e.target.value); setPwError(""); setPwStatus("idle"); }}
                placeholder={placeholder}
                className={`w-full rounded-xl border bg-[#0F0F11] px-4 py-3 pr-12 text-sm text-white placeholder:text-white/25 outline-none transition-colors ${
                  label === "Confirm new password" && confirmPassword && confirmPassword !== newPassword
                    ? "border-red-500/60" : "border-[#1F1F23] focus:border-[#00AFEF]/50"
                }`}
              />
              <button type="button" onClick={toggle} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors">
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {label === "New password" && newPassword.length > 0 && (
              <div className="space-y-1 px-1">
                <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-300 ${strength.color}`} style={{ width: strength.width }} />
                </div>
                <p className={`text-[11px] font-medium ${strength.label === "Weak" ? "text-red-400" : strength.label === "Fair" ? "text-orange-400" : strength.label === "Good" ? "text-yellow-400" : "text-[#00AFEF]"}`}>{strength.label}</p>
              </div>
            )}
          </div>
        ))}

        {pwError && <p className="flex items-center gap-1.5 text-xs text-red-400"><AlertCircle size={12} />{pwError}</p>}
        {pwStatus === "success" && <p className="flex items-center gap-1.5 text-xs text-emerald-400"><Check size={12} />Password updated successfully.</p>}

        <button onClick={handlePasswordChange} disabled={pwStatus === "loading" || !currentPassword || !newPassword || !confirmPassword}
          className="flex items-center gap-2 rounded-xl bg-[#00AFEF] px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-[#00AFEF]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {pwStatus === "loading" ? <><Loader2 size={14} className="animate-spin" />Updating...</> : "Update Password"}
        </button>
      </div>

      {/* Privacy Settings */}
      <div className="rounded-2xl border border-[#1F1F23] bg-[#121215] p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><Shield size={16} className="text-[#00AFEF]" /><h3 className="text-sm font-semibold text-white">Privacy Settings</h3></div>
          {savingPrivacy && <span className="flex items-center gap-1.5 text-xs text-gray-500"><Loader2 size={11} className="animate-spin" />Saving...</span>}
          {privacySaved  && <span className="flex items-center gap-1.5 text-xs text-emerald-400"><Check size={11} />Saved</span>}
        </div>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5 flex-1">
            <p className="text-sm font-medium text-white">Hide email address</p>
            <p className="text-xs text-gray-500">When enabled, other builders viewing your profile cannot see your email address.</p>
          </div>
          <button onClick={handleHideEmailToggle}
            className={`w-11 h-6 rounded-full transition-colors relative duration-200 outline-none shrink-0 mt-0.5 ${hideEmail ? "bg-[#00AFEF]" : "bg-[#27272A]"}`}>
            <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all duration-200 ${hideEmail ? "left-6" : "left-1"}`} />
          </button>
        </div>
      </div>
    </div>
  );
}