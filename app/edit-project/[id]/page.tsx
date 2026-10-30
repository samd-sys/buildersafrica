
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ProjectData, EMPTY_PROJECT } from "../../new-project/types/project";
import ProgressBar from "../../new-project/components/ProgressBar";
import StepWrapper from "../../new-project/components/StepWrapper";
import Step2Name from "../../new-project/components/steps/Step2Name";
import Step3Description from "../../new-project/components/steps/Step3Description";
import Step4Category from "../../new-project/components/steps/Step4Category";
import Step5Problem from "../../new-project/components/steps/Step5Problem";
import Step6Audience from "../../new-project/components/steps/Step6Audience";
import Step7Location from "../../new-project/components/steps/Step7Location";
import Step8Stage from "../../new-project/components/steps/Step8Stage";
import Step9TeamNeeds from "../../new-project/components/steps/Step9TeamNeeds";
import Step10TechStack from "../../new-project/components/steps/Step10TechStack";
import Step11Logo from "../../new-project/components/steps/Step11Logo";
import Step12Vision from "../../new-project/components/steps/Step12Vision";
import { ChevronLeft, Loader2, CheckCircle2 } from "lucide-react";

const TOTAL_STEPS = 11;

function normArray(val: string[] | string | null | undefined): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;

  if (typeof val === "string") {
    const trimmed = val.trim();

    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
      } catch {
        // Fall through to comma-separated parsing.
      }
    }

    return trimmed.split(",").map((s) => s.trim()).filter(Boolean);
  }

  return [];
}

function validate(step: number, data: ProjectData): string | null {
  switch (step) {
    case 1:
      return data.title.trim() ? null : "Project name is required.";
    case 2:
      return data.description.trim() ? null : "Please describe your project.";
    case 3:
      return data.category ? null : "Please select a category.";
    case 4:
      return data.problemStatement.trim()
        ? null
        : "Please describe the problem your project solves.";
    case 5:
      return data.targetAudience.length > 0
        ? null
        : "Please select at least one audience.";
    case 6:
      return data.location.trim() ? null : "Please enter your location.";
    case 7:
      return data.stage ? null : "Please select your current stage.";
    case 8:
      return data.teamNeeds.length > 0
        ? null
        : "Please select at least one role.";
    case 9:
      return data.techStack.length > 0
        ? null
        : "Please add at least one technology.";
    case 11:
      return data.vision.trim()
        ? null
        : "Please share your long-term vision.";
    default:
      return null;
  }
}

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const [data, setData] = useState<ProjectData>(EMPTY_PROJECT);
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  // Sidebar animation
  useEffect(() => {
    const handleSidebarHover = (event: Event) => {
      const customEvent = event as CustomEvent;
      setIsSidebarHovered(customEvent.detail.isHovered);
    };

    window.addEventListener("sidebarHover", handleSidebarHover);

    return () => {
      window.removeEventListener("sidebarHover", handleSidebarHover);
    };
  }, []);

  // Load existing project
  useEffect(() => {
    if (!projectId) return;

    let isMounted = true;

    const loadProject = async () => {
      setIsLoading(true);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!isMounted) return;

        if (!user) {
          alert("You must be logged in.");
          router.push("/login");
          return;
        }

        const { data: project, error: fetchError } = await supabase
          .from("projects")
          .select("*")
          .eq("id", projectId)
          .eq("user_id", user.id)
          .single();

        if (!isMounted) return;

        if (fetchError || !project) {
          alert("Project not found or you don't have permission to edit it.");
          router.push("/my-projects");
          return;
        }

        setData({
          title: project.title || "",
          description: project.description || "",
          category: project.category || "",
          problemStatement: project.problem_statement || "",
          targetAudience: normArray(project.target_audience),
          location: project.location || "",
          stage: project.stage || "",
          teamNeeds: normArray(project.team_needs),
          techStack: normArray(project.tech_stack),
          logoUrl: project.logo_url || "",
          vision: project.vision || "",
        });

        setIsLoading(false);
      } catch (err) {
        console.error("Error loading project:", err);

        if (isMounted) {
          alert("Something went wrong while loading your project.");
          router.push("/my-projects");
        }
      }
    };

    loadProject();

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  const update = <K extends keyof ProjectData>(
    key: K,
    value: ProjectData[K]
  ) => {
    setData((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const handleNext = () => {
    const validationError = validate(step, data);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setStep((current) => Math.min(current + 1, TOTAL_STEPS));
  };

  const handleBack = () => {
    setError(null);
    setStep((current) => Math.max(current - 1, 1));
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("You must be logged in.");
        return;
      }

      const { error: updateError } = await supabase
        .from("projects")
        .update({
          title: data.title,
          description: data.description,
          category: data.category,
          stage: data.stage,
          location: data.location,
          logo_url: data.logoUrl || null,
          tech_stack: data.techStack,
          problem_statement: data.problemStatement,
          vision: data.vision,
          target_audience: data.targetAudience,
          team_needs: data.teamNeeds,
        })
        .eq("id", projectId)
        .eq("user_id", user.id);

      if (updateError) {
        alert(updateError.message);
        return;
      }

      setIsSaved(true);
    } catch (err) {
      console.error("Error updating project:", err);
      alert("Something went wrong while saving your project.");
    } finally {
      setIsSaving(false);
    }
  };

  const isLastStep = step === TOTAL_STEPS;

  // Map edit steps to the existing new-project components.
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Step2Name
            value={data.title}
            onChange={(v) => update("title", v)}
            error={error ?? undefined}
          />
        );

      case 2:
        return (
          <Step3Description
            value={data.description}
            onChange={(v) => update("description", v)}
            error={error ?? undefined}
          />
        );

      case 3:
        return (
          <Step4Category
            value={data.category}
            onChange={(v) => update("category", v)}
            error={error ?? undefined}
          />
        );

      case 4:
        return (
          <Step5Problem
            value={data.problemStatement}
            onChange={(v) => update("problemStatement", v)}
            error={error ?? undefined}
          />
        );

      case 5:
        return (
          <Step6Audience
            value={data.targetAudience}
            onChange={(v) => update("targetAudience", v)}
            error={error ?? undefined}
          />
        );

      case 6:
        return (
          <Step7Location
            value={data.location}
            onChange={(v) => update("location", v)}
            error={error ?? undefined}
          />
        );

      case 7:
        return (
          <Step8Stage
            value={data.stage}
            onChange={(v) => update("stage", v)}
            error={error ?? undefined}
          />
        );

      case 8:
        return (
          <Step9TeamNeeds
            value={data.teamNeeds}
            onChange={(v) => update("teamNeeds", v)}
            error={error ?? undefined}
          />
        );

      case 9:
        return (
          <Step10TechStack
            value={data.techStack}
            onChange={(v) => update("techStack", v)}
            error={error ?? undefined}
          />
        );

      case 10:
        return (
          <Step11Logo
            value={data.logoUrl}
            onChange={(v) => update("logoUrl", v)}
          />
        );

      case 11:
        return (
          <Step12Vision
            value={data.vision}
            onChange={(v) => update("vision", v)}
            error={error ?? undefined}
          />
        );

      default:
        return null;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={28} className="animate-spin text-[#00AFEF]" />
          <p className="text-sm text-muted">Loading your project...</p>
        </div>
      </div>
    );
  }

  // Success state
  if (isSaved) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-surface p-10 text-center shadow-xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
            <CheckCircle2 size={36} className="text-emerald-500" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              Project Updated!
            </h2>

            <p className="text-sm text-muted">
              Your changes to{" "}
              <span className="font-medium text-[#00AFEF]">
                {data.title}
              </span>{" "}
              have been saved.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push("/my-projects")}
              className="w-full rounded-xl bg-[#00AFEF]/80 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#00AFEF]"
            >
              Back to My Projects
            </button>

            <button
              onClick={() => {
                setIsSaved(false);
                setStep(1);
              }}
              className="w-full rounded-xl border border-border py-3 text-sm text-muted transition-colors hover:bg-surface-secondary hover:text-foreground"
            >
              Continue Editing
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative mx-auto mt-3 flex min-h-[calc(100dvh-1.5rem)] w-full items-center justify-center overflow-hidden rounded-2xl border border-border bg-background px-3 py-5 transition-all duration-500 ease-in-out sm:mt-4 sm:min-h-[calc(100dvh-2rem)] sm:rounded-3xl sm:px-5 sm:py-8 md:px-8 lg:mt-6 lg:min-h-[540px] lg:ml-[6.25rem] lg:w-[calc(100%-6.25rem)] lg:px-4 lg:py-10 ${
        isSidebarHovered ? "lg:scale-[1.005]" : "scale-100"
      }`}
      style={{
        transform: isSidebarHovered ? "scale(1.005)" : "scale(1)",
        filter: isSidebarHovered ? "brightness(0.98)" : "brightness(1)",
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <div className="w-full min-w-0 max-w-2xl space-y-4 sm:space-y-6">

        {/* Header */}
        <div className="flex w-full min-w-0 items-center justify-between gap-3">
          <button
            onClick={() => router.push("/my-projects")}
            className="flex shrink-0 items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
          >
            <ChevronLeft size={16} />
            My Projects
          </button>

          <span className="min-w-0 truncate text-right text-[10px] font-medium uppercase tracking-wider text-muted sm:text-xs">
            Editing: {data.title || "Untitled"}
          </span>
        </div>

        {/* Progress bar */}
        <ProgressBar currentStep={step} totalSteps={TOTAL_STEPS} />

        {/* Step card */}
        <div className="max-h-[65dvh] min-w-0 overflow-y-auto overflow-x-hidden rounded-2xl border border-border bg-surface p-4 shadow-2xl shadow-black/10 sm:max-h-[65dvh] sm:rounded-3xl sm:p-6 lg:max-h-[55vh] lg:rounded-4xl lg:p-8">
          <StepWrapper step={step}>
            {renderStep()}
          </StepWrapper>
        </div>

        {/* Navigation */}
        <div className="flex w-full items-center justify-between gap-3">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className="flex shrink-0 items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30 sm:px-5"
          >
            <ChevronLeft size={16} />
            Back
          </button>

          {isLastStep ? (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex min-w-0 items-center justify-center gap-2 rounded-xl bg-[#00AFEF]/80 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#00AFEF]/10 transition-all hover:bg-[#00AFEF] active:scale-[0.98] disabled:opacity-60 sm:px-7"
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="shrink-0 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes ✓"
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="shrink-0 rounded-xl bg-[#00AFEF]/80 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#00AFEF] active:scale-[0.98] sm:px-7"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
