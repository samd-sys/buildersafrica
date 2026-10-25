"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ProjectData, EMPTY_PROJECT } from "./types/project";
import ProgressBar from "./components/ProgressBar";
import StepWrapper from "./components/StepWrapper";
import SuccessScreen from "./components/SuccessScreen";
import {
  Step1Welcome,
  Step2Name,
  Step3Description,
  Step4Category,
  Step5Problem,
  Step6Audience,
  Step7Location,
  Step8Stage,
  Step9TeamNeeds,
  Step10TechStack,
  Step11Logo,
  Step12Vision,
  Step13Review,
} from "./components/steps";
import { ChevronLeft, Loader2 } from "lucide-react";

const TOTAL_STEPS = 13;

function validate(step: number, data: ProjectData): string | null {
  switch (step) {
    case 2:
      return data.title.trim() ? null : "Project name is required.";
    case 3:
      return data.description.trim()
        ? null
        : "Please describe your project.";
    case 4:
      return data.category ? null : "Please select a category.";
    case 5:
      return data.problemStatement.trim()
        ? null
        : "Please describe the problem your project solves.";
    case 6:
      return data.targetAudience.length > 0
        ? null
        : "Please select at least one audience.";
    case 7:
      return data.location.trim() ? null : "Please enter your location.";
    case 8:
      return data.stage ? null : "Please select your current stage.";
    case 9:
      return data.teamNeeds.length > 0
        ? null
        : "Please select at least one role you're looking for.";
    case 10:
      return data.techStack.length > 0
        ? null
        : "Please add at least one technology.";
    case 12:
      return data.vision.trim()
        ? null
        : "Please share your long-term vision.";
    default:
      return null;
  }
}

export default function NewProjectPage() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<ProjectData>(EMPTY_PROJECT);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  // Sidebar animation
  useEffect(() => {
    const handleSidebarHover = (event: CustomEvent) => {
      setIsSidebarHovered(event.detail.isHovered);
    };
    window.addEventListener("sidebarHover", handleSidebarHover as EventListener);
    return () =>
      window.removeEventListener("sidebarHover", handleSidebarHover as EventListener);
  }, []);

  const update = <K extends keyof ProjectData>(key: K, value: ProjectData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const handleNext = () => {
    const err = validate(step, data);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const handleBack = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleCreate = async () => {
    setIsSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("You must be logged in.");
      setIsSaving(false);
      return;
    }

    const { error: dbError } = await supabase.from("projects").insert([
      {
        user_id: user.id,
        title: data.title,
        description: data.description,
        category: data.category,
        stage: data.stage,
        location: data.location,
        logo_url: data.logoUrl || null,
        tech_stack: data.techStack,
        visibility: "public",
        team_size: null,
      },
    ]);

    // Insert extended fields added via ALTER TABLE
    // If your projects table doesn't have these columns yet,
    // run the SQL from connections_table.sql first.
    if (!dbError) {
      // Fetch the newly created project id so we can upsert extended fields
      const { data: newProject } = await supabase
        .from("projects")
        .select("id")
        .eq("user_id", user.id)
        .eq("title", data.title)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (newProject) {
        await supabase.from("projects").update({
          problem_statement: data.problemStatement,
          vision: data.vision,
          target_audience: data.targetAudience,
          team_needs: data.teamNeeds,
        }).eq("id", newProject.id);
      }
    }

    setIsSaving(false);

    if (dbError) {
      alert(dbError.message);
    } else {
      setIsSuccess(true);
    }
  };

  const handleCreateAnother = () => {
    setData(EMPTY_PROJECT);
    setStep(1);
    setError(null);
    setIsSuccess(false);
  };

  const isFirstStep = step === 1;
  const isLastStep = step === TOTAL_STEPS;
  const showProgress = step > 1 && !isSuccess;
  const showNav = step > 1 && !isSuccess;

  return (
  <div
  className={`h-135 w-220 mt-6 rounded-3xl border border-white/29 flex items-center justify-center px-4 py-10 overflow-hidden bg-cover bg-center bg-no-repeat transition-all duration-500 ease-in-out ${
    isSidebarHovered ? "ml-16" : "ml-0"
  }`}
  style={{
    marginLeft: "6.25rem", // equivalent to ml-25 if needed
    backgroundImage: "url('/Untitled-2.png')", // Your image path
    transform: isSidebarHovered ? "scale(1.005)" : "scale(1)",
    filter: isSidebarHovered ? "brightness(0.98)" : "brightness(1)",
    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
  }}

    >
      <div className="w-full max-w-2xl space-y-6">
        {/* Progress bar — hidden on welcome and success */}
        {showProgress && (
          <ProgressBar currentStep={step - 1} totalSteps={TOTAL_STEPS - 1} />
        )}

        {/* Step card */}
        <div className="max-h-[75vh] overflow-y-auto overflow-x-hidden rounded-4xl border border-[#1F1F23] bg-[#0F0F11] p-8 shadow-2xl shadow-black/40">
          <StepWrapper step={step}>
            {isSuccess ? (
              <SuccessScreen
                projectTitle={data.title}
                onCreateAnother={handleCreateAnother}
              />
            ) : step === 1 ? (
              <Step1Welcome onNext={handleNext} />
            ) : step === 2 ? (
              <Step2Name
                value={data.title}
                onChange={(v) => update("title", v)}
                error={error ?? undefined}
              />
            ) : step === 3 ? (
              <Step3Description
                value={data.description}
                onChange={(v) => update("description", v)}
                error={error ?? undefined}
              />
            ) : step === 4 ? (
              <Step4Category
                value={data.category}
                onChange={(v) => update("category", v)}
                error={error ?? undefined}
              />
            ) : step === 5 ? (
              <Step5Problem
                value={data.problemStatement}
                onChange={(v) => update("problemStatement", v)}
                error={error ?? undefined}
              />
            ) : step === 6 ? (
              <Step6Audience
                value={data.targetAudience}
                onChange={(v) => update("targetAudience", v)}
                error={error ?? undefined}
              />
            ) : step === 7 ? (
              <Step7Location
                value={data.location}
                onChange={(v) => update("location", v)}
                error={error ?? undefined}
              />
            ) : step === 8 ? (
              <Step8Stage
                value={data.stage}
                onChange={(v) => update("stage", v)}
                error={error ?? undefined}
              />
            ) : step === 9 ? (
              <Step9TeamNeeds
                value={data.teamNeeds}
                onChange={(v) => update("teamNeeds", v)}
                error={error ?? undefined}
              />
            ) : step === 10 ? (
              <Step10TechStack
                value={data.techStack}
                onChange={(v) => update("techStack", v)}
                error={error ?? undefined}
              />
            ) : step === 11 ? (
              <Step11Logo
                value={data.logoUrl}
                onChange={(v) => update("logoUrl", v)}
              />
            ) : step === 12 ? (
              <Step12Vision
                value={data.vision}
                onChange={(v) => update("vision", v)}
                error={error ?? undefined}
              />
            ) : (
              <Step13Review data={data} />
            )}
          </StepWrapper>
        </div>

        {/* Bottom navigation */}
        {showNav && !isSuccess && (
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={isFirstStep}
              className="flex items-center gap-2 rounded-xl border border-[#1F1F23] bg-[#0F0F11] px-5 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:text-white hover:border-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
              Back
            </button>

            {isLastStep ? (
              <button
                onClick={handleCreate}
                disabled={isSaving}
                className="flex items-center gap-2 rounded-xl bg-[#00AFEF]/40 px-7 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#00AFEF]/20 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Project → "
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="rounded-xl bg-[#00AFEF]/50 px-7 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#00AFEF]/30 active:scale-[0.98]"
              >
                Next →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}