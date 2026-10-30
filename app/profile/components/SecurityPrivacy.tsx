
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Loader2,
  Lock,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Shield,
} from "lucide-react";

export default function SecurityPrivacy() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwStatus, setPwStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [pwError, setPwError] = useState("");
  const [hideEmail, setHideEmail] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [privacySaved, setPrivacySaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("hide_email")
      .eq("user_id", user.id)
      .single();

    if (profile) setHideEmail(profile.hide_email ?? false);

    setLoading(false);
  };

  const getStrength = (pw: string) => {
    if (!pw) return { label: "", color: "", width: "0%" };

    let s = 0;

    if (pw.length >= 12) s++;
    if (pw.length >= 16) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;

    if (s <= 1)
      return { label: "Weak", color: "bg-red-500", width: "25%" };

    if (s === 2)
      return { label: "Fair", color: "bg-orange-400", width: "50%" };

    if (s === 3)
      return { label: "Good", color: "bg-yellow-400", width: "75%" };

    return {
      label: "Strong",
      color: "bg-[#00AFEF]",
      width: "100%",
    };
  };

  const strength = getStrength(newPassword);

  const handlePasswordChange = async () => {
    setPwError("");

    if (!newPassword || newPassword.length < 12) {
      setPwError("Password must be at least 12 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwError("Passwords do not match.");
      return;
    }

    setPwStatus("loading");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      setPwError("Could not verify your session.");
      setPwStatus("error");
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      setPwError("Current password is incorrect.");
      setPwStatus("error");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setPwError("Failed to update password. Please try again.");
      setPwStatus("error");
    } else {
      setPwStatus("success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleHideEmailToggle = async () => {
    const updated = !hideEmail;

    setHideEmail(updated);
    setSavingPrivacy(true);
    setPrivacySaved(false);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from("profiles")
        .update({ hide_email: updated })
        .eq("user_id", user.id);
    }

    setSavingPrivacy(false);
    setPrivacySaved(true);

    setTimeout(() => setPrivacySaved(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[#00AFEF]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-background p-8">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-foreground">
          Security & Privacy
        </h2>
        <p className="text-sm text-muted">
          Manage your password and control your privacy settings.
        </p>
      </div>

      {/* Change Password */}
      <div className="space-y-5 rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-center gap-2">
          <Lock size={16} className="text-[#00AFEF]" />
          <h3 className="text-sm font-semibold text-foreground">
            Change Password
          </h3>
        </div>

        {[
          {
            label: "Current password",
            value: currentPassword,
            set: setCurrentPassword,
            show: showCurrent,
            toggle: () => setShowCurrent((v) => !v),
            placeholder: "Enter current password",
          },
          {
            label: "New password",
            value: newPassword,
            set: setNewPassword,
            show: showNew,
            toggle: () => setShowNew((v) => !v),
            placeholder: "Min. 12 characters",
          },
          {
            label: "Confirm new password",
            value: confirmPassword,
            set: setConfirmPassword,
            show: showConfirm,
            toggle: () => setShowConfirm((v) => !v),
            placeholder: "Repeat new password",
          },
        ].map(({ label, value, set, show, toggle, placeholder }) => (
          <div key={label} className="space-y-1.5">
            <label className="text-xs text-muted">{label}</label>

            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={value}
                onChange={(e) => {
                  set(e.target.value);
                  setPwError("");
                  setPwStatus("idle");
                }}
                placeholder={placeholder}
                className={`w-full rounded-xl border bg-surface-secondary px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted/60 outline-none transition-colors ${
                  label === "Confirm new password" &&
                  confirmPassword &&
                  confirmPassword !== newPassword
                    ? "border-red-500/60"
                    : "border-border focus:border-[#00AFEF]/60"
                }`}
              />

              <button
                type="button"
                onClick={toggle}
                aria-label={show ? `Hide ${label}` : `Show ${label}`}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-foreground"
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {label === "New password" && newPassword.length > 0 && (
              <div className="space-y-1 px-1">
                <div className="h-1 w-full overflow-hidden rounded-full bg-surface-secondary">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                    style={{ width: strength.width }}
                  />
                </div>

                <p
                  className={`text-[11px] font-medium ${
                    strength.label === "Weak"
                      ? "text-red-400"
                      : strength.label === "Fair"
                        ? "text-orange-400"
                        : strength.label === "Good"
                          ? "text-yellow-400"
                          : "text-[#00AFEF]"
                  }`}
                >
                  {strength.label}
                </p>
              </div>
            )}
          </div>
        ))}

        {pwError && (
          <p
            role="alert"
            className="flex items-center gap-1.5 text-xs text-red-400"
          >
            <AlertCircle size={12} />
            {pwError}
          </p>
        )}

        {pwStatus === "success" && (
          <p
            role="status"
            className="flex items-center gap-1.5 text-xs text-emerald-400"
          >
            <Check size={12} />
            Password updated successfully.
          </p>
        )}

        <button
          type="button"
          onClick={handlePasswordChange}
          disabled={
            pwStatus === "loading" ||
            !currentPassword ||
            !newPassword ||
            !confirmPassword
          }
          className="flex items-center gap-2 rounded-xl bg-[#00AFEF] px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-[#00AFEF]/80 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pwStatus === "loading" ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Updating...
            </>
          ) : (
            "Update Password"
          )}
        </button>
      </div>

      {/* Privacy Settings */}
      <div className="space-y-5 rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-[#00AFEF]" />
            <h3 className="text-sm font-semibold text-foreground">
              Privacy Settings
            </h3>
          </div>

          {savingPrivacy && (
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <Loader2 size={11} className="animate-spin" />
              Saving...
            </span>
          )}

          {privacySaved && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <Check size={11} />
              Saved
            </span>
          )}
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-0.5">
            <p className="text-sm font-medium text-foreground">
              Hide email address
            </p>
            <p className="text-xs text-muted">
              When enabled, other builders viewing your profile cannot see your
              email address.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={hideEmail}
            aria-label="Hide email address"
            onClick={handleHideEmailToggle}
            className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#00AFEF] focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
              hideEmail ? "bg-[#00AFEF]" : "bg-surface-secondary"
            }`}
          >
            <div
              className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all duration-200 ${
                hideEmail ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
