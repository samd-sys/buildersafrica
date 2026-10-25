"use client";

import { type ChangeEvent, type FormEvent, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";

declare const process: { env: Record<string, string | undefined> };
// ─── Types ───────────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  captcha?: string;
  general?: string;
}

// ─── Password strength ───────────────────────────────────────────────────────

type StrengthLevel = "weak" | "fair" | "good" | "strong";

function getPasswordStrength(password: string): {
  level: StrengthLevel;
  label: string;
  width: string;
  color: string;
} {
  if (password.length === 0)
    return { level: "weak", label: "", width: "0%", color: "" };

  let score = 0;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { level: "weak",   label: "Weak",   width: "25%",  color: "bg-red-500"    };
  if (score === 2) return { level: "fair",   label: "Fair",   width: "50%",  color: "bg-orange-400" };
  if (score === 3) return { level: "good",   label: "Good",   width: "75%",  color: "bg-yellow-400" };
  return              { level: "strong", label: "Strong", width: "100%", color: "bg-[#00AFEF]"  };
}

// ─── Validation ──────────────────────────────────────────────────────────────

const MAX_NAME_LENGTH  = 80;
const MAX_EMAIL_LENGTH = 254;
const MAX_PASS_LENGTH  = 128;
const MIN_PASS_LENGTH  = 12;

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};

  const name = form.name.trim();
  if (!name || name.length < 2)
    errors.name = "Please enter at least 2 characters.";
  else if (name.length > MAX_NAME_LENGTH)
    errors.name = `Name must be ${MAX_NAME_LENGTH} characters or fewer.`;

  const email = form.email.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = "Enter a valid email address.";
  else if (email.length > MAX_EMAIL_LENGTH)
    errors.email = "Email address is too long.";

  if (!form.password || form.password.length < MIN_PASS_LENGTH)
    errors.password = `Password must be at least ${MIN_PASS_LENGTH} characters.`;
  else if (form.password.length > MAX_PASS_LENGTH)
    errors.password = "Password is too long.";

  if (!form.confirmPassword)
    errors.confirmPassword = "Please confirm your password.";
  else if (form.password !== form.confirmPassword)
    errors.confirmPassword = "Passwords do not match.";

  return errors;
}


// ─── Safe error messages (never expose raw Supabase errors) ──────────────────

function safeErrorMessage(err: unknown): string {
  if (!(err instanceof Error)) return "Something went wrong. Please try again.";
  const msg = err.message.toLowerCase();

  if (msg.includes("already registered") || msg.includes("already exists") || msg.includes("duplicate"))
    return "An account with this email already exists. Try logging in instead.";
  if (msg.includes("invalid email"))
    return "Please enter a valid email address.";
  if (msg.includes("password"))
    return "Your password doesn't meet the requirements. Please choose a stronger one.";
  if (msg.includes("rate limit") || msg.includes("too many"))
    return "Too many attempts. Please wait a moment and try again.";
  if (msg.includes("network") || msg.includes("fetch"))
    return "Network error. Please check your connection and try again.";

  // Never surface raw DB / Supabase error details
  return "Something went wrong. Please try again.";
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Signup() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors]           = useState<FormErrors>({});
  const [loading, setLoading]         = useState(false);
  const [success, setSuccess]         = useState(false);
  const [showPassword, setShowPassword]           = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const strength = getPasswordStrength(form.password);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev: FormState) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev: FormErrors) => ({ ...prev, [name]: undefined }));
    }
  }

  const handleCaptchaSuccess = useCallback((token: string) => {
    setCaptchaToken(token);
    setErrors((prev: FormErrors) => ({ ...prev, captcha: undefined }));
  }, []);

  const handleCaptchaExpire = useCallback(() => {
    setCaptchaToken(null);
  }, []);

  async function handleSignup(e: FormEvent) {
    e.preventDefault();

    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!captchaToken) {
      setErrors({ captcha: "Please complete the CAPTCHA verification." });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Sanitise inputs — never log or manually store the password
      const cleanEmail = form.email.trim().toLowerCase();
      const cleanName  = form.name.trim();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: form.password,          // passed directly to Supabase Auth, never stored elsewhere
        options: {
          captchaToken,                   // Turnstile token validated server-side by Supabase
          data: {
            full_name: cleanName,         // stored in auth.users.raw_user_meta_data
          },                              // the DB trigger reads this to create the profile row
        },
      });

      if (signUpError) throw signUpError;
      if (!data.user)  throw new Error("Signup failed — no user returned.");

      if (data.session) {
        router.push("/dashboard");
      } else {
        setSuccess(true);
      }
    } catch (err: unknown) {
      setErrors({ general: safeErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-120 mt-22 rounded-4xl border border-white/30 items-center justify-center bg-gray px-6">
        <div className="w-full max-w-xl rounded-3xl border border-white/30 bg-gray p-10">
          <h1 className="text-3xl font-semibold text-white">
            Confirm your email
          </h1>
          <p className="mt-4 text-slate-400">
            We sent a confirmation link to
            <span className="text-white"> {form.email.trim().toLowerCase()}</span>
          </p>
          <div className="mt-8 flex gap-4">
            <Link
              href="/login"
              className="rounded-full border border-cyan-400/30 px-6 py-3 text-cyan-200"
            >
              Go to Login
            </Link>
            <Link
              href="/"
              className="rounded-full bg-cyan-400 px-6 py-3 text-slate-950"
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Signup form ──────

  return (
    <div className="relative min-h-screen overflow-hidden bg-black-950 flex items-center justify-center px-4">

      {/* Header */}
      <nav className="absolute top-0 left-0 w-full z-50 border-b border-white/10 bg-gray/40 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-13.2 w-15 items-center justify-center overflow-hidden rounded-xl">
              <img src="/B8.png" alt="BuildersAfrica Logo" className="h-16 w-16 object-cover" />
            </div>
            <div>
              <p className="text-white font-bold text-2xl leading-none">
                <span className="text-white">Builders</span>
                <span className="text-[#00AFEF]">Africa</span>
              </p>
              <p className="text-white/40 text-sm mt-1">Developers Platform</p>
            </div>
          </div>
          <Link
            href="/"
            className="absolute top-5 right-5 rounded-md border border-white/10 bg-cyan-gray px-10 py-2 text-lg font-medium text-white/30 transitio"
          >
            ← Return
          </Link>
        </div>
      </nav>

      {/* Signup Form — card layout unchanged */}
      <div className="flex items-center justify-center px-6 py-20">
        <section className="w-xl bg-white/[0.04] backdrop-blur-2xl border border-white/20 rounded-4xl p-8 shadow-2xl">
          <h2 className="text-3xl font-semibold text-white">
            Sign up to BuildersAfrica
          </h2>

          {errors.general && (
            <div className="mt-4 rounded-xl bg-red-500/10 p-4 text-red-200">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSignup} className="mt-6 space-y-5" noValidate>

            {/* Full Name */}
            <div className="space-y-1">
              <input
                name="name"
                placeholder="Full name"
                value={form.name}
                onChange={handleChange}
                maxLength={MAX_NAME_LENGTH}
                autoComplete="name"
                className={`w-full rounded-xl border px-4 py-4 text-white bg-transparent ${
                  errors.name ? "border-red-500/60" : "border-white/15"
                }`}
              />
              {errors.name && (
                <p className="text-xs text-red-400 px-1">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <input
                name="email"
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                maxLength={MAX_EMAIL_LENGTH}
                autoComplete="email"
                className={`w-full rounded-xl border px-4 py-4 text-white bg-transparent ${
                  errors.email ? "border-red-500/60" : "border-white/15"
                }`}
              />
              {errors.email && (
                <p className="text-xs text-red-400 px-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password (min. 12 characters)"
                  value={form.password}
                  onChange={handleChange}
                  maxLength={MAX_PASS_LENGTH}
                  autoComplete="new-password"
                  className={`w-full rounded-xl border px-4 py-4 pr-12 text-white bg-transparent ${
                    errors.password ? "border-red-500/60" : "border-white/15"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v: boolean) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Password strength indicator */}
              {form.password.length > 0 && (
                <div className="space-y-1 px-1">
                  <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                      style={{ width: strength.width }}
                    />
                  </div>
                  <p className={`text-[11px] font-medium ${
                    strength.level === "weak"   ? "text-red-400"    :
                    strength.level === "fair"   ? "text-orange-400" :
                    strength.level === "good"   ? "text-yellow-400" :
                    "text-[#00AFEF]"
                  }`}>
                    {strength.label}
                  </p>
                </div>
              )}

              {errors.password && (
                <p className="text-xs text-red-400 px-1">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <div className="relative">
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  maxLength={MAX_PASS_LENGTH}
                  autoComplete="new-password"
                  className={`w-full rounded-xl border px-4 py-4 pr-12 text-white bg-transparent ${
                    errors.confirmPassword ? "border-red-500/60" : "border-white/15"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v: boolean) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-400 px-1">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Cloudflare Turnstile CAPTCHA */}
            <div className="space-y-1">
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""}
                onSuccess={handleCaptchaSuccess}
                onExpire={handleCaptchaExpire}
                options={{ theme: "dark" }}
              />
              {errors.captcha && (
                <p className="text-xs text-red-400 px-1">{errors.captcha}</p>
              )}
            </div>

            {/* Submit — unchanged */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-[#00AFEF] py-3 font-semibold text-slate-950 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>

            {/* Login link — unchanged */}
            <p className="mt-6 text-center text-x1 text-white/35">
              Already have an account?{" "}
              <a href="/login" className="text-[#00AFEF] font-medium hover:underline transition-colors">
                Login →
              </a>
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}