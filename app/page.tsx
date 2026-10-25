"use client";

import Link from "next/link";
import HowItWorks from "./HowItWorks";

export default function LandingPage() {
  return (
    <div className="h-142 w-270 -mt-1 -ml-6">

      {/* HEADER */}
      <header className="fixed left-1/2 top-6 z-50 flex w-full max-w-[750px] -translate-x-1/2 items-center justify-between rounded-3xl border border-white/20 bg-slate-950/70 px-4 py-3 md:px-6 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex h-10.2 w-13 items-center justify-center overflow-hidden rounded-xl">
            <img src="/B8.png" alt="BuildersAfrica Logo" className="h-14 w-14 object-cover" />
          </div>
          <p className="text-lg tracking-[0.25em] text-white">
            <span className="text-white">Builders</span>
            <span className="text-[#00AFEF]">Africa</span>
          </p>
        </div>

        <div className="mx-4 h-6 w-px -ml-10 bg-white/30" />

        <Link
          href="/login"
          className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-8 py-2.5 text-sm text-white hover:bg-cyan-400/20"
        >
          Log in
        </Link>
      </header>

      {/* HERO */}
      <div className="relative z-10 mx-auto mt-15 w-full max-w-[1150px] overflow-hidden rounded-3xl p-6 md:p-14 backdrop-blur-md">

        {/* VIDEO BACKGROUND */}
        <video autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover z-0">
          <source src="/vedio 5.mp4" type="video/mp4" />
        </video>

        {/* OVERLAY */}
        <div className="absolute inset-0 bg-slate-900/40 z-0" />

        {/* CONTENT */}
        <div className="relative z-10 w-full max-w-5xl text-center space-y-22">
          <section className="space-y-10">
            <p className="text-sm uppercase tracking-[0.4em] mt-6 text-[#00AFEF]">
              Sign up with confidence
            </p>
          </section>
          <section className="space-y-12">
            <h1 className="text-5xl md:text-6xl -mt-4 font-semibold leading-tight text-white">
              Launch your profile, join teams, and build with Africa's top creators.
            </h1>
          </section>

          <div className="mt-30 flex justify-center">
            <Link
              href="/signup"
              className="rounded-3xl bg-[#00AFEF] px-12 py-2 text-base font-semibold text-slate-950 transition-all hover:bg-cyan-300"
            >
              Sign Up Now
            </Link>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <HowItWorks />

    </div>
  );
}