
"use client";

import Link from "next/link";
import HowItWorks from "./HowItWorks";

export default function LandingPage() {
  return (
    <main className="relative -mt-1 min-h-screen w-full overflow-x-clip bg-black">

      {/* HEADER */}
      <header className="fixed left-1/2 top-3 z-50 flex w-[calc(100%-1rem)] max-w-[750px] -translate-x-1/2 items-center justify-between rounded-3xl border border-white/20 bg-slate-950/90 px-3 py-2 shadow-lg backdrop-blur-md sm:top-6 sm:px-5 sm:py-3 md:px-6">

        {/* LOGO AND BRAND */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl sm:h-14 sm:w-14">
            <img
              src="/B8.png"
              alt="BuildersAfrica Logo"
              className="h-full w-full object-cover"
            />
          </div>

          <p className="whitespace-nowrap text-sm tracking-[0.08em] text-white sm:text-lg sm:tracking-[0.2em]">
            <span>Builders</span>
            <span className="text-[#00AFEF]">Africa</span>
          </p>
        </div>

        {/* DIVIDER */}
        <div className="mx-2 hidden h-7 w-px shrink-0 bg-white/30 sm:block md:mx-4" />

        {/* LOGIN */}
        <Link
          href="/login"
          className="shrink-0 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs text-white transition-colors hover:bg-cyan-400/20 sm:px-8 sm:py-2.5 sm:text-sm"
        >
          Log in
        </Link>
      </header>

      {/* HERO */}
      <section className="relative z-10 mx-auto mt-20 w-full max-w-[1150px] overflow-hidden rounded-3xl px-4 py-10 sm:mt-24 sm:px-6 sm:py-12 md:mt-15 md:p-14">

        {/* VIDEO BACKGROUND */}
        <video
          autoPlay
          loop
          muted
          playsInline
          aria-hidden="true"
          className="absolute inset-0 z-0 h-full w-full object-cover"
        >
          <source src="/vedio 5.mp4" type="video/mp4" />
        </video>

        {/* OVERLAY */}
        <div className="absolute inset-0 z-0 bg-slate-950/50" />

        {/* CONTENT */}
        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center gap-10 text-center sm:gap-14 md:gap-20">

          <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-[#00AFEF] sm:text-sm sm:tracking-[0.4em]">
            Sign up with confidence
          </p>

          <h1 className="-mt-3 w-full max-w-4xl text-3xl font-semibold leading-tight text-white sm:text-4xl md:text-6xl">
            Launch your profile, join teams, and build with Africa&apos;s top
            creators.
          </h1>

          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-3xl bg-[#00AFEF] px-8 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300 sm:px-12 sm:py-3.5 sm:text-base"
          >
            Sign Up Now
          </Link>

        </div>
      </section>

      {/* HOW IT WORKS */}
      <HowItWorks />

    </main>
  );
}
