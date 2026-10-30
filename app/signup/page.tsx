
"use client";

import { type ChangeEvent, type FormEvent, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";

declare const process: { env: Record<string, string | undefined> };

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

type StrengthLevel = "weak" | "fair" | "good" | "strong";

function getPasswordStrength(password: string): {
  level: StrengthLevel;
  label: string;
  width: string;
  color: string;
} {
  if (!password.length) {
    return { level: "weak", label: "", width: "0%", color: "" };
  }

  let score = 0;

  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) {
    return { level: "weak", label: "Weak", width: "25%", color: "bg-red-500" };
  }

  if (score === 2) {
    return { level: "fair", label: "Fair", width: "50%", color: "bg-orange-400" };
  }

  if (score === 3) {
    return { level: "good", label: "Good", width: "75%", color: "bg-yellow-400" };
  }

  return {
    level: "strong",
    label: "Strong",
    width: "100%",
    color: "bg-[#00AFEF]",
  };
}

const MAX_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 254;
const MAX_PASS_LENGTH = 128;
const MIN_PASS_LENGTH = 12;

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  const name = form.name.trim();

  if (!name || name.length < 2) {
    errors.name = "Please enter at least 2 characters.";
  } else if (name.length > MAX_NAME_LENGTH) {
    errors.name = `Name must be ${MAX_NAME_LENGTH} characters or fewer.`;
  }

  const email = form.email.trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address.";
  } else if (email.length > MAX_EMAIL_LENGTH) {
    errors.email = "Email address is too long.";
  }

  if (!form.password || form.password.length < MIN_PASS_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASS_LENGTH} characters.`;
  } else if (form.password.length > MAX_PASS_LENGTH) {
    errors.password = "Password is too long.";
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

function safeErrorMessage(err: unknown): string {
  if (!(err instanceof Error)) {
    return "Something went wrong. Please try again.";
  }

  const msg = err.message.toLowerCase();

  if (
    msg.includes("already registered") ||
    msg.includes("already exists") ||
    msg.includes("duplicate")
  ) {
    return "An account with this email already exists. Try logging in instead.";
  }

  if (msg.includes("invalid email")) {
    return "Please enter a valid email address.";
  }

  if (msg.includes("password")) {
    return "Your password doesn't meet the requirements. Please choose a stronger one.";
  }

  if (msg.includes("rate limit") || msg.includes("too many")) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  if (msg.includes("network") || msg.includes("fetch")) {
    return "Network error. Please check your connection and try again.";
  }

  return "Something went wrong. Please try again.";
}

export default function Signup() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const strength = getPasswordStrength(form.password);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;

    setForm((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  const handleCaptchaSuccess = useCallback((token: string) => {
    setCaptchaToken(token);
    setErrors((prev) => ({ ...prev, captcha: undefined }));
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
      const cleanEmail = form.email.trim().toLowerCase();
      const cleanName = form.name.trim();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: form.password,
        options: {
          captchaToken,
          data: {
            full_name: cleanName,
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!data.user) throw new Error("Signup failed — no user returned.");

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

  // Email confirmation screen
  if (success) {
    return (
      <main className="flex min-h-screen w-full items-center justify-center overflow-x-clip bg-background px-4 py-8 text-foreground sm:px-6">
        <section className="w-full max-w-xl rounded-2xl border border-border bg-surface p-5 shadow-2xl sm:rounded-3xl sm:p-8 md:p-10">
          <h1 className="text-2xl font-semibold sm:text-3xl">
            Confirm your email
          </h1>

          <p className="mt-4 break-words text-sm leading-6 text-muted sm:text-base">
            We sent a confirmation link to{" "}
            <span className="break-all font-medium text-foreground">
              {form.email.trim().toLowerCase()}
            </span>
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/login"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-border px-6 py-3 text-center text-[#00AFEF] transition-colors hover:bg-surface-secondary"
            >
              Go to Login
            </Link>

            <Link
              href="/"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#00AFEF] px-6 py-3 text-center font-medium text-slate-950 transition-opacity hover:opacity-90"
            >
              Home
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen w-full flex-col overflow-x-clip bg-background text-foreground">
      {/* Header */}
      <nav className="relative z-10 w-full border-b border-border bg-surface/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[76px] w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg sm:h-14 sm:w-14">
              <img
                src="/B8.png"
                alt="BuildersAfrica Logo"
                className="h-full w-full object-contain"
              />
            </div>

            <div className="min-w-0">
              <p className="whitespace-nowrap text-lg font-bold leading-tight sm:text-2xl">
                <span className="text-foreground">Builders</span>
                <span className="text-[#00AFEF]">Africa</span>
              </p>

              <p className="mt-1 text-xs text-muted sm:text-sm">
                Developers Platform
              </p>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-secondary px-3 py-2 text-sm font-medium text-muted transition-colors hover:border-[#00AFEF]/40 hover:text-foreground sm:px-5 sm:text-base"
          >
            <span className="sm:hidden">← Back</span>
            <span className="hidden sm:inline">← Return</span>
          </Link>
        </div>
      </nav>

      {/* Signup form */}
      <div className="relative flex flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        {/* Background grid */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <section className="relative z-10 w-full max-w-xl rounded-2xl border border-border bg-surface p-4 shadow-2xl sm:rounded-3xl sm:p-7 md:p-9">
          <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
            Sign up to BuildersAfrica
          </h1>

          <p className="mt-2 text-sm leading-6 text-muted sm:text-base">
            Create your account and start building with Africa&apos;s tech
            community.
          </p>

          {errors.general && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm leading-6 text-red-500 sm:p-4"
            >
              {errors.general}
            </div>
          )}

          <form
            onSubmit={handleSignup}
            className="mt-6 space-y-5 sm:mt-7"
            noValidate
          >
            {/* Full name */}
            <div className="space-y-1.5">
              <label
                htmlFor="signup-name"
                className="block text-sm font-medium text-foreground"
              >
                Full name
              </label>

              <input
                id="signup-name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                value={form.name}
                onChange={handleChange}
                maxLength={MAX_NAME_LENGTH}
                autoComplete="name"
                autoCapitalize="words"
                required
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "signup-name-error" : undefined}
                className={`block min-h-12 w-full min-w-0 rounded-xl border bg-background px-4 py-3 text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-[#00AFEF] ${
                  errors.name ? "border-red-500/60" : "border-border"
                }`}
              />

              {errors.name && (
                <p id="signup-name-error" className="px-1 text-xs text-red-500">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="signup-email"
                className="block text-sm font-medium text-foreground"
              >
                Email address
              </label>

              <input
                id="signup-email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                maxLength={MAX_EMAIL_LENGTH}
                autoComplete="email"
                inputMode="email"
                autoCapitalize="none"
                spellCheck={false}
                required
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "signup-email-error" : undefined}
                className={`block min-h-12 w-full min-w-0 rounded-xl border bg-background px-4 py-3 text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-[#00AFEF] ${
                  errors.email ? "border-red-500/60" : "border-border"
                }`}
              />

              {errors.email && (
                <p id="signup-email-error" className="px-1 text-xs text-red-500">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="signup-password"
                className="block text-sm font-medium text-foreground"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="signup-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 12 characters"
                  value={form.password}
                  onChange={handleChange}
                  maxLength={MAX_PASS_LENGTH}
                  autoComplete="new-password"
                  required
                  aria-invalid={!!errors.password}
                  aria-describedby={
                    errors.password ? "signup-password-error" : undefined
                  }
                  className={`block min-h-12 w-full min-w-0 rounded-xl border bg-background py-3 pl-4 pr-12 text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-[#00AFEF] ${
                    errors.password ? "border-red-500/60" : "border-border"
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00AFEF]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>

              {/* Password strength */}
              {form.password.length > 0 && (
                <div className="space-y-1.5 px-1 pt-1">
                  <div className="h-1 w-full overflow-hidden rounded-full bg-surface-secondary">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                      style={{ width: strength.width }}
                    />
                  </div>

                  <p
                    className={`text-xs font-medium ${
                      strength.level === "weak"
                        ? "text-red-500"
                        : strength.level === "fair"
                          ? "text-orange-500"
                          : strength.level === "good"
                            ? "text-yellow-500"
                            : "text-[#00AFEF]"
                    }`}
                  >
                    Password strength: {strength.label}
                  </p>
                </div>
              )}

              {errors.password && (
                <p
                  id="signup-password-error"
                  className="px-1 text-xs text-red-500"
                >
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <label
                htmlFor="signup-confirm-password"
                className="block text-sm font-medium text-foreground"
              >
                Confirm password
              </label>

              <div className="relative">
                <input
                  id="signup-confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  maxLength={MAX_PASS_LENGTH}
                  autoComplete="new-password"
                  required
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={
                    errors.confirmPassword
                      ? "signup-confirm-password-error"
                      : undefined
                  }
                  className={`block min-h-12 w-full min-w-0 rounded-xl border bg-background py-3 pl-4 pr-12 text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-[#00AFEF] ${
                    errors.confirmPassword
                      ? "border-red-500/60"
                      : "border-border"
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00AFEF]"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>

              {errors.confirmPassword && (
                <p
                  id="signup-confirm-password-error"
                  className="px-1 text-xs text-red-500"
                >
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Cloudflare Turnstile */}
            <div className="min-w-0 space-y-2">
              <div className="flex w-full min-w-0 justify-center overflow-x-auto">
                <Turnstile
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""}
                  onSuccess={handleCaptchaSuccess}
                  onExpire={handleCaptchaExpire}
                  options={{ theme: "auto" }}
                />
              </div>

              {errors.captcha && (
                <p role="alert" className="text-center text-xs text-red-500">
                  {errors.captcha}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[#00AFEF] px-4 py-3 text-base font-semibold text-slate-950 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:rounded-2xl"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>

            {/* Login link */}
            <p className="pt-1 text-center text-sm leading-6 text-muted sm:text-base">
              Already have an account?{" "}
              <Link
                href="/login"
                className="whitespace-nowrap font-medium text-[#00AFEF] transition-colors hover:underline"
              >
                Login →
              </Link>
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
