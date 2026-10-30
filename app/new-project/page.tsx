
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
    const handleSidebarHover = (event: Event) => {
      const customEvent = event as CustomEvent;
      setIsSidebarHovered(customEvent.detail.isHovered);
    };

    window.addEventListener(
      "sidebarHover",
      handleSidebarHover
    );

    return () =>
      window.removeEventListener(
        "sidebarHover",
        handleSidebarHover
      );
  }, []);

  const update = <K extends keyof ProjectData>(
    key: K,
    value: ProjectData[K]
  ) => {
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
    if (isSaving) return;

    setIsSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("You must be logged in.");
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

      // Update the extended project fields after the initial insert.
      if (!dbError) {
        const { data: newProject } = await supabase
          .from("projects")
          .select("id")
          .eq("user_id", user.id)
          .eq("title", data.title)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (newProject) {
          await supabase
            .from("projects")
            .update({
              problem_statement: data.problemStatement,
              vision: data.vision,
              target_audience: data.targetAudience,
              team_needs: data.teamNeeds,
            })
            .eq("id", newProject.id);
        }
      }

      if (dbError) {
        alert(dbError.message);
      } else {
        setIsSuccess(true);
      }
    } catch (err) {
      console.error("Failed to create project:", err);
      alert(
        "Something went wrong while creating your project. Please try again."
      );
    } finally {
      setIsSaving(false);
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
      className={`relative mx-auto mt-3 flex min-h-[calc(100dvh-1.5rem)] w-full items-center justify-center overflow-hidden rounded-2xl border border-border bg-cover bg-center bg-no-repeat px-3 py-5 transition-all duration-500 ease-in-out sm:mt-4 sm:min-h-[calc(100dvh-2rem)] sm:rounded-3xl sm:px-5 sm:py-8 md:px-8 lg:mt-6 lg:min-h-[540px] lg:ml-[6.25rem] lg:w-[calc(100%-6.25rem)] lg:px-4 lg:py-10 ${
        isSidebarHovered ? "lg:scale-[1.005]" : "scale-100"
      }`}
      style={{
        backgroundImage: "url('/Untitled-2.png')",
        filter: isSidebarHovered ? "brightness(0.98)" : "brightness(1)",
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <div className="w-full min-w-0 max-w-2xl space-y-4 sm:space-y-6">
        {/* Progress bar — hidden on welcome and success */}
        {showProgress && (
          <ProgressBar
            currentStep={step - 1}
            totalSteps={TOTAL_STEPS - 1}
          />
        )}

        {/* Step card */}
        <div className="max-h-[70dvh] min-w-0 overflow-y-auto overflow-x-hidden rounded-2xl border border-border bg-surface p-4 shadow-2xl shadow-black/10 sm:max-h-[75dvh] sm:rounded-3xl sm:p-6 lg:rounded-4xl lg:p-8">
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
        {showNav && (
          <div className="flex w-full items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleBack}
              disabled={isFirstStep || isSaving}
              className="flex shrink-0 items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:border-[#00AFEF]/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30 sm:px-5"
            >
              <ChevronLeft size={16} />
              Back
            </button>

            {isLastStep ? (
              <button
                type="button"
                onClick={handleCreate}
                disabled={isSaving}
                className="flex min-w-0 items-center justify-center gap-2 rounded-xl bg-[#00AFEF] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#009bd4] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:px-7"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={14} className="shrink-0 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Project →"
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="shrink-0 rounded-xl bg-[#00AFEF] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#009bd4] active:scale-[0.98] sm:px-7"
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
