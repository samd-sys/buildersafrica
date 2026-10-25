"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Turnstile } from "@marsidev/react-turnstile"
import { supabase } from "@/lib/supabase"

interface FormErrors {
  email?: string
  password?: string
  general?: string
}

// ── Main Login Page ───────────────────────────────────────────────────────
export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" })
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)

  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    setForm(prev => ({ ...prev, [name]: value }))

    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const validate = (): boolean => {
    const e: FormErrors = {}

    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = "Enter a valid email address"
    }

    if (!form.password || form.password.length < 8) {
      e.password = "Password must be at least 8 characters"
    }

    setErrors(e)

    return Object.keys(e).length === 0
  }

  const handleLogin = async () => {
    if (!validate()) return

    if (!captchaToken) {
      setErrors({
        general: "Please complete the CAPTCHA verification.",
      })
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: {
          captchaToken,
        },
      })

      if (error) {
        setErrors({
          general:
            error.message === "Invalid login credentials"
              ? "Incorrect email or password. Please try again."
              : "Unable to sign in. Please check your details and try again.",
        })

        setCaptchaToken(null)
        return
      }

      router.push("/projects")
    } catch {
      setErrors({
        general: "Something went wrong. Please try again.",
      })

      setCaptchaToken(null)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin()
    }
  }

  return (
    <div className="relative h-190 border border-white/20 rounded-2xl overflow-hidden bg-black-950 flex items-center justify-center px-4">

      {/* Navbar */}
      <nav className="absolute top-0 left-0 w-full z-50 border-b border-white/10 bg-gray/40 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center px-6">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-13.2 w-15 items-center justify-center overflow-hidden rounded-xl">
              <img
                src="/B8.png"
                alt="BuildersAfrica Logo"
                className="h-16 w-16 object-cover"
              />
            </div>

            <div>
              <p className="text-white font-bold text-2xl leading-none">
                <span className="text-white">Builders</span>
                <span className="text-[#00AFEF]">Africa</span>
              </p>

              <p className="text-white/40 text-sm mt-1">
                Developers Platform
              </p>
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

      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.08) 0px,transparent 1px)",
          backgroundSize: "52px 52px",
        }}
      />

      {/* Two-column layout */}
      <div className="relative z-10 w-full max-w-5xl mx-auto py-12">

        {/* Login form */}
        <div className="w-full max-w-2xl mx-auto max-h-[calc(100vh-9rem)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <div className="w-full bg-white/[0.04] backdrop-blur-2xl border border-white/20 rounded-4xl p-8 shadow-2xl">

            {/* Heading */}
            <div className="mb-6">
              <h1 className="text-5xl font-bold text-white text-center">
                Welcome back!
              </h1>

              <p className="text-lg text-white/40 mt-1 text-center">
                Sign in to continue building
              </p>
            </div>

            {/* General error */}
            {errors.general && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>

                <p className="text-sm text-red-400">
                  {errors.general}
                </p>
              </div>
            )}

            {/* Email */}
            <div className="mb-4">
              <label
                className="block text-sm font-medium text-white/50 mb-1.5"
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
                className={`w-128 h-13 px-3 py-2.5 rounded-lg text-sm text-white placeholder-white/20 outline-none transition
                  bg-white/5 border focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400/50 disabled:opacity-50
                  ${errors.email
                    ? "border-red-500/40 bg-red-500/5"
                    : "border-white/10 hover:border-white/20"
                  }`}
              />

              {errors.email && (
                <p className="mt-1 text-xs text-red-400">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-1.5">
                <label
                  className="text-sm font-medium text-white/50"
                  htmlFor="password"
                >
                  Password
                </label>

                <a
                  href="/forgot-password"
                  className="text-sm text-white/50 hover:underline transition-colors"
                >
                  Forgot password?
                </a>
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
                  className={`w-full px-3 py-2.5 pr-10 rounded-lg text-sm text-white placeholder-white/20 outline-none transition
                    bg-white/5 border focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400/50 disabled:opacity-50
                    ${errors.password
                      ? "border-red-500/40 bg-red-500/5"
                      : "border-white/10 hover:border-white/20"
                    }`}
                />

                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  tabIndex={-1}
                >
                  {showPass ? (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
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
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>

              {errors.password && (
                <p className="mt-1 text-xs text-red-400">
                  {errors.password}
                </p>
              )}
            </div>

            {/* CAPTCHA */}
            <div className="mb-5 flex justify-center">
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                onSuccess={(token) => {
                  setCaptchaToken(token)
                  setErrors(prev => ({
                    ...prev,
                    general: undefined,
                  }))
                }}
                onExpire={() => {
                  setCaptchaToken(null)
                }}
                onError={() => {
                  setCaptchaToken(null)
                  setErrors({
                    general: "CAPTCHA verification failed. Please try again.",
                  })
                }}
              />
            </div>

            {/* Sign in */}
            <button
              onClick={handleLogin}
              disabled={loading || !captchaToken}
              className="w-full py-2.5 bg-[#00AFEF] disabled:bg-cyan-400/40
                text-slate-950 text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-cyan-500/20
                focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-transparent"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
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

            {/* Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-white/8" />

              <span className="text-sm text-white/25">
                or continue with
              </span>

              <div className="flex-1 h-px bg-white/8" />
            </div>

            {/* GitHub */}
            <button
              onClick={() =>
                supabase.auth.signInWithOAuth({
                  provider: "github",
                  options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                  },
                })
              }
              disabled={loading}
              className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20
                text-white/70 hover:text-white text-lg font-medium rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577v-2.165c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77 1.653.242 2.874.118 3.176.77.84 1.235 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
              </svg>

              GitHub
            </button>

            {/* Sign up */}
            <p className="mt-6 text-center text-x1 text-white/35">
              New to BuildersAfrica?{" "}
              <a
                href="/signup"
                className="text-[#00AFEF] font-medium hover:underline transition-colors"
              >
                Create an account →
              </a>
            </p>

          </div>
        </div>
      </div>
    </div>
  )
}