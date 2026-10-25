
"use client";

import { useState } from "react";

type Step = {
  label: string;
  title: string;
  description: string;
  image: string;
  gradient: string;
  glowColor: string;
};

const BUILDER_STEPS: Step[] = [
  {
    label: "Step 1",
    title: "Create Your Profile",
    description:
      "Set up your builder profile with your skills, experience, and the regions you want to work in. Your profile is your passport into the BuildersAfrica ecosystem.",
    image: "/profile .2.png",
    gradient:
      "linear-gradient(135deg, #0d1f12 0%, #0d1a2e 50%, #091520 100%)",
    glowColor: "rgba(0,175,239,0.15)",
  },
  {
    label: "Step 2",
    title: "Explore Projects",
    description:
      "Browse live projects from founders across Africa. Filter by category, stage, and tech stack to find collaborations that match your skills.",
    image: "/projects.png",
    gradient:
      "linear-gradient(135deg, #091428 0%, #0e1f40 50%, #0d1f28 100%)",
    glowColor: "rgba(0,120,200,0.15)",
  },
  {
    label: "Step 3",
    title: "Apply to Join a Team",
    description:
      "Apply for open positions on projects you believe in. Submit your experience, skills, and motivation directly to the founder — no middlemen, no delays.",
    image: "/apply.png",
    gradient:
      "linear-gradient(135deg, #0e1030 0%, #14183a 50%, #0e1030 100%)",
    glowColor: "rgba(80,60,200,0.15)",
  },
  {
    label: "Final Step",
    title: "Start Building",
    description:
      "Once accepted, collaborate with your team inside BuildersAfrica. Use the team chat, manage tasks, and ship together — all in one place.",
    image: "/build 1.png",
    gradient:
      "linear-gradient(135deg, #091a20 0%, #0e2030 50%, #091a1a 100%)",
    glowColor: "rgba(0,175,239,0.12)",
  },
];

const FOUNDER_STEPS: Step[] = [
  {
    label: "Step 1",
    title: "Create Your Profile",
    description:
      "Build your founder profile and establish your presence in the African tech ecosystem. Show the community who you are and what you're working toward.",
    image: "/profile 2.png",
    gradient:
      "linear-gradient(135deg, #0d1f12 0%, #0d1a2e 50%, #091520 100%)",
    glowColor: "rgba(0,175,239,0.15)",
  },
  {
    label: "Step 2",
    title: "Create Your Project",
    description:
      "Launch your project on BuildersAfrica. Define the problem you're solving, your tech stack, target audience, and the roles you need filled.",
    image: "/project.png",
    gradient:
      "linear-gradient(135deg, #091428 0%, #0e1f40 50%, #0d1f28 100%)",
    glowColor: "rgba(0,120,200,0.15)",
  },
  {
    label: "Step 3",
    title: "Find Your Team",
    description:
      "Review applications from talented builders across Africa. See their skills and experience, then accept the right people for each role.",
    image: "/team.png",
    gradient:
      "linear-gradient(135deg, #0e1030 0%, #14183a 50%, #0e1030 100%)",
    glowColor: "rgba(80,60,200,0.15)",
  },
  {
    label: "Final Step",
    title: "Start Building",
    description:
      "Your team is assembled. Kick off your team chat, assign roles, and start shipping. Everything your team needs to collaborate is already built in.",
    image: "/build.png",
    gradient:
      "linear-gradient(135deg, #091a20 0%, #0e2030 50%, #091a1a 100%)",
    glowColor: "rgba(0,175,239,0.12)",
  },
];

/* Dashed connector between steps */
function Connector({ flip }: { flip: boolean }) {
  return (
    <div className="relative hidden h-20 w-full items-center justify-center md:flex">
      <svg
        viewBox="0 0 600 80"
        preserveAspectRatio="none"
        className="h-full w-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d={
            flip
              ? "M300 0 C300 35 180 45 180 80"
              : "M300 0 C300 35 420 45 420 80"
          }
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1.5"
          strokeDasharray="6 5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/* Responsive step card */
function StepCard({
  step,
  index,
}: {
  step: Step;
  index: number;
}) {
  const isRight = index % 2 !== 0;
  const isFinal = index === 3;
  const isLeft = index % 2 === 0 && !isFinal;

  return (
    <div className="flex w-full flex-col items-center">

      {/* STEP LABEL */}
      <div
        className={`relative z-10 -mb-3 flex w-full ${
          isFinal
            ? "mt-10 justify-center md:mt-20"
            : isRight
              ? "mt-5 md:-mt-12 md:justify-end md:pr-80"
              : "mt-5 md:-mt-12 md:justify-start md:pl-80"
        }`}
      >
        <span className="inline-flex items-center rounded-full border border-white/15 bg-[#111] px-5 py-1.5 text-xs font-semibold text-white shadow-lg">
          {step.label}
        </span>
      </div>

      {/* STEP IMAGE */}
      <div
        className={`relative h-[200px] w-full overflow-hidden rounded-2xl border border-white/15 bg-[#091520] sm:h-[240px] sm:rounded-[28px] md:h-[180px] md:w-[50%] md:rounded-[34px] ${
          isFinal
            ? "md:mx-auto"
            : isLeft
              ? "md:mr-auto md:ml-30"
              : isRight
                ? "md:ml-70"
                : ""
        }`}
      >
        <img
          src={step.image}
          alt={`${step.title} — complete card design`}
          className="absolute inset-0 h-full w-full object-cover object-center"
          loading="lazy"
          onError={(e) => {
            const img = e.currentTarget;
            img.style.display = "none";

            const parent = img.parentElement;

            if (!parent || parent.querySelector(".image-placeholder")) {
              return;
            }

            const placeholder = document.createElement("div");

            placeholder.className =
              "image-placeholder absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#091520] p-6 text-center";

            const message = document.createElement("p");
            message.className = "text-sm text-white/60";
            message.textContent = "Full-card screenshot not found";

            const path = document.createElement("code");
            path.className = "break-all text-xs text-[#00AFEF]";
            path.textContent = step.image;

            placeholder.append(message, path);
            parent.appendChild(placeholder);
          }}
        />
      </div>
    </div>
  );
}

export default function HowItWorks() {
  const [tab, setTab] = useState<"builder" | "founder">("builder");

  const steps = tab === "builder" ? BUILDER_STEPS : FOUNDER_STEPS;

  return (
    <section className="relative w-full max-w-full overflow-x-clip px-4 py-16 sm:py-20 md:px-8 md:py-8">

      {/* TOP DIVIDER */}
      <div className="absolute left-1/2 top-0 h-px w-full max-w-5xl -translate-x-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative z-10 mx-auto w-full max-w-5xl space-y-12 sm:space-y-14">

        {/* HEADING */}
        <div className="mx-auto max-w-2xl space-y-4 text-center">
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
            How <span className="text-white">Builders</span>
            <span className="text-[#00AFEF]">Africa</span> Works
          </h2>

          <p className="text-sm leading-relaxed text-white/50 sm:text-base">
            From profile to production — here is the path that builders and
            founders across the continent are taking every day.
          </p>
        </div>

        {/* BUILDER / FOUNDER TOGGLE */}
        <div className="flex justify-center">
          <div className="flex max-w-full gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1.5">
            {(["builder", "founder"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                aria-pressed={tab === t}
                className={`rounded-xl px-4 py-2.5 text-xs font-semibold transition-all duration-200 sm:px-8 sm:text-sm ${
                  tab === t
                    ? "bg-[#00AFEF] text-slate-950 shadow-md shadow-[#00AFEF]/20"
                    : "text-white/50 hover:text-white"
                }`}
              >
                {t === "builder" ? "For Builders" : "For Founders"}
              </button>
            ))}
          </div>
        </div>

        {/* JOURNEY */}
        <div className="mt-8 space-y-8 sm:mt-12 sm:space-y-10 md:mt-24 md:space-y-0">
          {steps.map((step, i) => (
            <div key={`${tab}-${i}`} className="w-full">
              <StepCard step={step} index={i} />

              {i < steps.length - 1 && (
                <Connector flip={i % 2 === 0} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM DIVIDER */}
      <div className="absolute bottom-0 left-1/2 h-px w-full max-w-5xl -translate-x-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </section>
  );
}
