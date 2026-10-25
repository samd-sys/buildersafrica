
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Turnstile } from "@marsidev/react-turnstile";
import { supabase } from "@/lib/supabase";

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const e: FormErrors = {};

    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = "Enter a valid email address";
    }

    if (!form.password || form.password.length < 8) {
      e.password = "Password must be at least 8 characters";
    }

    setErrors(e);

    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    if (!captchaToken) {
      setErrors({
        general: "Please complete the CAPTCHA verification.",
      });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: {
          captchaToken,
        },
      });

      if (error) {
        setErrors({
          general:
            error.message === "Invalid login credentials"
              ? "Incorrect email or password. Please try again."
              : "Unable to sign in. Please check your details and try again.",
        });

        setCaptchaToken(null);
        return;
      }

      router.push("/projects");
    } catch {
      setErrors({
        general: "Something went wrong. Please try again.",
      });

      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void handleLogin();
    }
  };

  const inputBaseClass =
    "w-full min-w-0 rounded-lg border bg-white/5 px-3 py-3 text-base text-white placeholder-white/20 outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/40 disabled:opacity-50 sm:text-sm";

  return (
    <main className="relative flex min-h-screen w-full max-w-full flex-col overflow-x-clip bg-black text-white">

      {/* GRID BACKGROUND */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.08) 0px,transparent 1px)",
          backgroundSize: "52px 52px",
        }}
      />

      {/* NAVBAR */}
      <nav className="relative z-50 w-full border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[76px] w-full max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:min-h-20 sm:px-6 lg:px-8">

          {/* LOGO */}
          <Link
            href="/"
            aria-label="BuildersAfrica home"
            className="flex min-w-0 items-center gap-2 sm:gap-3"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl sm:h-14 sm:w-14">
              <img
                src="/B8.png"
                alt="BuildersAfrica Logo"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="min-w-0">
              <p className="whitespace-nowrap text-base font-bold leading-tight sm:text-2xl">
                <span className="text-white">Builders</span>
                <span className="text-[#00AFEF]">Africa</span>
              </p>

              <p className="mt-1 text-[10px] text-white/40 sm:text-sm">
                Developers Platform
              </p>
            </div>
          </Link>

          {/* RETURN BUTTON */}
          <Link
            href="/"
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:border-cyan-400/30 hover:text-white sm:px-6 sm:py-2.5 sm:text-sm"
          >
            <span className="sm:hidden">← Back</span>
            <span className="hidden sm:inline">← Return</span>
          </Link>
        </div>
      </nav>

      {/* LOGIN CONTENT */}
      <div className="relative z-10 flex w-full flex-1 items-start justify-center px-3 py-8 sm:items-center sm:px-6 sm:py-12">

        {/* LOGIN CARD */}
        <div className="mx-auto w-full max-w-xl rounded-2xl border border-white/15 bg-white/[0.04] p-4 shadow-2xl backdrop-blur-2xl sm:rounded-3xl sm:p-8 md:p-10">

          {/* HEADING */}
          <div className="mb-6 text-center sm:mb-8">
            <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
              Welcome back!
            </h1>

            <p className="mt-2 text-sm text-white/40 sm:text-base">
              Sign in to continue building
            </p>
          </div>

          {/* GENERAL ERROR */}
          {errors.general && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3"
            >
              <svg
                className="mt-0.5 h-4 w-4 shrink-0 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>

              <p className="break-words text-sm text-red-400">
                {errors.general}
              </p>
            </div>
          )}

          {/* EMAIL */}
          <div className="mb-5">
            <label
              className="mb-2 block text-sm font-medium text-white/60"
              htmlFor="email"
            >
              Email address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              disabled={loading}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              className={`${inputBaseClass} ${
                errors.email
                  ? "border-red-500/40 bg-red-500/5"
                  : "border-white/10 hover:border-white/20"
              }`}
            />

            {errors.email && (
              <p id="email-error" className="mt-1.5 text-xs text-red-400">
                {errors.email}
              </p>
            )}
          </div>

          {/* PASSWORD */}
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between gap-2">
              <label
                className="text-sm font-medium text-white/60"
                htmlFor="password"
              >
                Password
              </label>

              <Link
                href="/forgot-password"
                className="text-xs text-white/50 transition-colors hover:text-[#00AFEF] hover:underline sm:text-sm"
              >
                Forgot password?
              </Link>
            </div>

            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                disabled={loading}
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password ? "password-error" : undefined
                }
                className={`${inputBaseClass} pr-12 ${
                  errors.password
                    ? "border-red-500/40 bg-red-500/5"
                    : "border-white/10 hover:border-white/20"
                }`}
              />

              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? "Hide password" : "Show password"}
                aria-pressed={showPass}
                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-white/40 transition-colors hover:bg-white/5 hover:text-white"
              >
                {showPass ? (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                )}
              </button>
            </div>

            {errors.password && (
              <p id="password-error" className="mt-1.5 text-xs text-red-400">
                {errors.password}
              </p>
            )}
          </div>

          {/* CLOUDFLARE TURNSTILE */}
          <div className="mb-6 flex w-full justify-center overflow-x-auto">
            <Turnstile
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
              onSuccess={(token) => {
                setCaptchaToken(token);
                setErrors((prev) => ({
                  ...prev,
                  general: undefined,
                }));
              }}
              onExpire={() => {
                setCaptchaToken(null);
              }}
              onError={() => {
                setCaptchaToken(null);
                setErrors({
                  general: "CAPTCHA verification failed. Please try again.",
                });
              }}
            />
          </div>

          {/* SIGN IN */}
          <button
            type="button"
            onClick={() => void handleLogin()}
            disabled={loading || !captchaToken}
            className="w-full rounded-lg bg-[#00AFEF] px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition-colors hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-black disabled:cursor-not-allowed disabled:bg-cyan-400/40"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Signing in...
              </span>
            ) : (
              "Sign in"
            )}
          </button>

          {/* DIVIDER */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />

            <span className="shrink-0 text-xs text-white/30 sm:text-sm">
              or continue with
            </span>

            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* GITHUB LOGIN */}
          <button
            type="button"
            onClick={() =>
              supabase.auth.signInWithOAuth({
                provider: "github",
                options: {
                  redirectTo: `${window.location.origin}/auth/callback`,
                },
              })
            }
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white/80 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white disabled:opacity-40 sm:text-base"
          >
            <svg
              className="h-5 w-5 shrink-0"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577v-2.165c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
            </svg>

            Continue with GitHub
          </button>

          {/* SIGN UP */}
          <p className="mt-6 text-center text-xs leading-relaxed text-white/40 sm:text-sm">
            New to BuildersAfrica?{" "}
            <Link
              href="/signup"
              className="font-medium text-[#00AFEF] transition-colors hover:underline"
            >
              Create an account →
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
