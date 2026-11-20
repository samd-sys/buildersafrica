
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import HowItWorks from "./HowItWorks";
import { supabase } from "@/lib/supabase";

type SocialProof = {
  builder_count: number;
  avatars: string[];
};

export default function LandingPage() {
  const [socialProof, setSocialProof] =
    useState<SocialProof | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchSocialProof = async (): Promise<void> => {
      const { data, error } = await supabase.rpc(
        "get_landing_social_proof"
      );

      if (error) {
        console.error("Social proof error:", error.message);
        return;
      }

      if (mounted && data?.[0]) {
        setSocialProof({
          builder_count: Number(data[0].builder_count),
          avatars: data[0].avatars ?? [],
        });
      }
    };

    void fetchSocialProof();

    const interval = setInterval(() => {
      void fetchSocialProof();
    }, 60000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <main className="relative -mt-4 min-h-screen w-full overflow-x-clip">
      {/* HEADER */}
      <header className="fixed left-1/2 top-3 z-50 flex w-[calc(100%-1rem)] max-w-[750px] -translate-x-1/2 items-center justify-between rounded-3xl border border-white/20 bg-slate-950/90 px-3 py-2 shadow-lg backdrop-blur-md sm:top-6 sm:px-5 sm:py-3 md:px-6">

        {/* LOGO AND BRAND */}
        <Link
          href="/"
          aria-label="BuildersAfrica home"
          className="flex min-w-0 items-center gap-2 sm:gap-3"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl sm:h-14 sm:w-14">
            <img
              src="/B8.png"
              alt="BuildersAfrica Logo"
              className="h-full w-full object-contain"
            />
          </div>

          <p className="whitespace-nowrap text-sm tracking-[0.08em] text-white sm:text-lg sm:tracking-[0.2em]">
            <span>Builders</span>
            <span className="text-[#00AFEF]">Africa</span>
          </p>
        </Link>

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
      {/* Increased padding here (py-20 sm:py-28 md:py-36) to make the container taller */}
      <section className="relative z-10 mx-auto mt-20 w-full max-w-[1150px] overflow-hidden rounded-3xl px-4 py-20 sm:mt-24 sm:px-6 sm:py-28 md:mt-15 md:px-14 md:py-36">

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

        {/* CONTENT */}
        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center gap-10 text-center sm:gap-14 md:gap-20">

          <p className="-mt-16 text-[10px] uppercase tracking-[0.2em] text-[#00AFEF] sm:text-sm sm:tracking-[0.4em]">
            Sign up with confidence
          </p>

          <h1 className="-mt-7 w-full max-w-4xl text-3xl font-semibold leading-tight text-white sm:text-4xl md:text-6xl">
            Launch your profile, join teams, and build with Africa's top
            creators.
          </h1>

          {/* SOCIAL PROOF */}
          {socialProof && (
            <div className="-mt-7 flex items-center justify-center gap-3 sm:-mt-8">

              {/* MEMBER AVATARS */}
              <div className="flex shrink-0 items-center -space-x-3">
                {socialProof.avatars.map((avatar, index) => (
                  <div
                    key={`${avatar}-${index}`}
                    className="h-10 w-10 overflow-hidden rounded-full border-2 border-white bg-slate-700 shadow-lg sm:h-12 sm:w-12"
                  >
                    <img
                      src={avatar}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}

                {/* FALLBACK IF NO AVATARS */}
                {socialProof.avatars.length === 0 && (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-slate-800 text-sm font-bold text-cyan-400 sm:h-12 sm:w-12">
                    B
                  </div>
                )}
              </div>

              {/* MEMBER COUNT */}
              <div className="text-left leading-tight">
                <p
                  aria-live="polite"
                  className="text-base font-bold text-white sm:text-xl"
                >
                  {socialProof.builder_count.toLocaleString()} builders
                </p>

                <p className="mt-1 text-xs text-white/75 sm:text-sm">
                  have joined{" "}
                  <span className="font-semibold text-white">
                    BuildersAfrica
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* SIGN UP BUTTON */}
          <Link
            href="/signup"
            className="inline-flex -mt-7 items-center justify-center rounded-3xl bg-[#00AFEF] px-12 py-3 text-sm font-semibold text-slate-950 transition-all duration-300 hover:-translate-y-1 hover:bg-cyan-300 hover:shadow-lg hover:shadow-cyan-500/20 sm:px-12 sm:py-3.5 sm:text-base"
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
