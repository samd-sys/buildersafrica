
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

// Dashed SVG connector between steps

function Connector({ flip }: { flip: boolean }) {
  return (
    <div className="relative hidden md:flex items-center justify-center h-20 w-full">
      <svg
        viewBox="0 0 600 80"
        preserveAspectRatio="none"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {flip ? (
          <path
            strokeWidth="1.5"
            strokeDasharray="6 5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <path
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1.5"
            strokeDasharray="6 5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </div>
  );
}


// Card with a full-card screenshot
function StepCard({
  step,
  index,
}: {
  step: Step;
  index: number;
}) {
  const isRight = index % 2 !== 0;
  const isFinal = index === 3;
  const isLeft = index % 2 === 0 && index !== 3;

  return (
    <div className="flex flex-col items-center w-full">
      {/* Step pill label */}
      
{/* Step pill label */}
<div
  className={`relative z-10 -mb-3 w-full flex ${
    isFinal
      ? "justify-center"
      : isRight
      ? "md:justify-end md:pr-80"
      : "md:justify-start md:pl-80"
  } ${isFinal ? "mt-20" : "-mt-12"}`}
>
  <span className="inline-flex items-center rounded-full bg-[#111] border border-white/15 px-6 py-1.5 text-xs font-semibold text-white shadow-lg">
    {step.label}
  </span>
</div>


      {/* Full-card image */}
      <div
  className={`relative w-full md:w-[50%] ${
    isFinal
      ? "md:mx-auto"
      : isLeft
      ? "md:mr-auto md:ml-30"
      : isRight
      ? "md:ml-70"
      : ""
  } h-[220px] md:h-[180px] rounded-[34px] border border-white/15 overflow-hidden bg-[#091520]`}
>
  <img
    src={step.image}
    alt={`${step.title} — complete card design`}
    className="absolute inset-0 w-full h-full object-cover object-center"
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
              "image-placeholder absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center bg-[#091520]";

            const message = document.createElement("p");
            message.className = "text-sm text-white/60";
            message.textContent = "Full-card screenshot not found";

            const path = document.createElement("code");
            path.className = "text-xs text-[#00AFEF]";
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
    <section className="relative w-full py-24 md:py-8 px-4 md:px-8 overflow-hidden">
      {/* Top divider */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

      <div className="relative z-10 mx-auto max-w-5xl space-y-14">
        {/* Heading */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight">
            How <span className="text-white">Builders</span>
            <span className="text-[#00AFEF]">Africa</span> Works
          </h2>

          <p className="text-base text-white/40 leading-relaxed">
            From profile to production — here is the path that builders and
            founders across the continent are taking every day.
          </p>
        </div>

        {/* Builder / Founder toggle */}
        <div className="flex justify-center -mt-6">
          <div className="flex rounded-2xl border border-white/10 bg-white/[0.03] -mt-4 p-1.5 gap-1">
            {(["builder", "founder"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-8 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  tab === t
                    ? "bg-[#00AFEF] text-slate-950 shadow-md shadow-[#00AFEF]/20"
                    : "text-white/40 hover:text-white"
                }`}
              >
                {t === "builder" ? "For Builders" : "For Founders"}
              </button>
            ))}
          </div>
        </div>

        {/* Journey */}
        <div className="mt-24 -space-y-4">
          {steps.map((step, i) => (
            <div key={`${tab}-${i}`}>
              <StepCard step={step} index={i} />

              {/* Connectors between steps */}
              {i < steps.length - 1 && (
                <Connector flip={i % 2 === 0} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom divider */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
    </section>
  );
}
