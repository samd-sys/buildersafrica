
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Project, Position } from "../types";
import {
  ArrowLeft,
  Loader2,
  Plus,
  X,
  CheckCircle2,
  Briefcase,
} from "lucide-react";
import Link from "next/link";

type FormState = {
  fullName: string;
  experience: string;
  skills: string[];
  portfolioLinks: string[];
  motivation: string;
};

type FormErrors = {
  fullName?: string;
  experience?: string;
  skills?: string;
  motivation?: string;
  general?: string;
};

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.fullName.trim() || form.fullName.trim().length < 2)
    errors.fullName = "Please enter your full name.";

  if (!form.experience.trim() || form.experience.trim().length < 20)
    errors.experience =
      "Please describe your experience (at least 20 characters).";

  if (form.skills.length === 0)
    errors.skills = "Please add at least one skill.";

  if (!form.motivation.trim() || form.motivation.trim().length < 20)
    errors.motivation =
      "Please tell us why you want to join (at least 20 characters).";

  return errors;
}

const inputBase =
  "w-full rounded-xl border bg-surface-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted/50 outline-none transition-colors";

const inputNormal = "border-border focus:border-[#00AFEF]/50";
const inputError = "border-red-500/60 focus:border-red-500/60";

const labelClass = "text-xs font-medium text-muted";

export default function ApplicationFormPage() {
  const params = useParams();
  const router = useRouter();

  const projectId = params?.projectId as string;
  const positionId = params?.positionId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  const [form, setForm] = useState<FormState>({
    fullName: "",
    experience: "",
    skills: [],
    portfolioLinks: [""],
    motivation: "",
  });

  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    const handleSidebarHover = (event: Event) => {
      const customEvent = event as CustomEvent;
      setIsSidebarHovered(customEvent.detail.isHovered);
    };

    window.addEventListener(
      "sidebarHover",
      handleSidebarHover as EventListener
    );

    return () =>
      window.removeEventListener(
        "sidebarHover",
        handleSidebarHover as EventListener
      );
  }, []);

  useEffect(() => {
    if (!projectId || !positionId) return;

    let isMounted = true;

    const loadPage = async () => {
      setLoading(true);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!isMounted) return;

        if (!user) {
          router.push("/login");
          return;
        }

        // Load project
        const { data: proj } = await supabase
          .from("projects")
          .select("id, title, description, logo_url, user_id, team_needs")
          .eq("id", projectId)
          .single();

        if (!isMounted) return;

        if (!proj) {
          router.push("/projects");
          return;
        }

        // Block founder from applying
        if (proj.user_id === user.id) {
          router.push(`/apply/${projectId}`);
          return;
        }

        setProject(proj);

        // Load position
        const { data: pos } = await supabase
          .from("project_positions")
          .select("*")
          .eq("id", positionId)
          .eq("project_id", projectId)
          .single();

        if (!isMounted) return;

        if (!pos) {
          router.push(`/apply/${projectId}`);
          return;
        }

        setPosition(pos);

        // Block duplicate applications
        const { data: existing } = await supabase
          .from("project_applications")
          .select("id")
          .eq("project_id", projectId)
          .eq("position_id", positionId)
          .eq("applicant_id", user.id)
          .maybeSingle();

        if (!isMounted) return;

        if (existing) {
          router.push(`/apply/${projectId}?alreadyApplied=true`);
          return;
        }

        // Pre-fill name from profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", user.id)
          .single();

        if (!isMounted) return;

        setForm((prev) => ({
          ...prev,
          fullName: profile?.full_name || "",
        }));

        setLoading(false);
      } catch (err) {
        console.error("Error loading application page:", err);

        if (isMounted) {
          setErrors({
            general: "Unable to load this application form. Please try again.",
          });
          setLoading(false);
        }
      }
    };

    loadPage();

    return () => {
      isMounted = false;
    };
  }, [projectId, positionId, router]);

  const addSkill = () => {
    const trimmed = skillInput.trim();

    if (!trimmed || form.skills.includes(trimmed)) return;

    setForm((prev) => ({
      ...prev,
      skills: [...prev.skills, trimmed],
    }));

    setSkillInput("");
    setErrors((prev) => ({ ...prev, skills: undefined }));
  };

  const removeSkill = (skill: string) => {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  };

  const updatePortfolioLink = (index: number, value: string) => {
    setForm((prev) => {
      const links = [...prev.portfolioLinks];
      links[index] = value;

      return {
        ...prev,
        portfolioLinks: links,
      };
    });
  };

  const addPortfolioLink = () => {
    if (form.portfolioLinks.length >= 3) return;

    setForm((prev) => ({
      ...prev,
      portfolioLinks: [...prev.portfolioLinks, ""],
    }));
  };

  const removePortfolioLink = (index: number) => {
    setForm((prev) => ({
      ...prev,
      portfolioLinks: prev.portfolioLinks.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validate(form);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated.");

      const cleanLinks = form.portfolioLinks
        .map((link) => link.trim())
        .filter(Boolean);

      // Insert application
      const { error: insertError } = await supabase
        .from("project_applications")
        .insert([
          {
            project_id: projectId,
            position_id: positionId,
            applicant_id: user.id,
            full_name: form.fullName.trim(),
            experience: form.experience.trim(),
            skills: form.skills,
            portfolio_links: cleanLinks,
            motivation: form.motivation.trim(),
            status: "pending",
          },
        ]);

      if (insertError) throw insertError;

      // Notify project manager
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert([
          {
            user_id: project!.user_id,
            title: "New Application",
            message: `${form.fullName.trim()} has applied for the ${position!.title} position on your project: ${project!.title}`,
            type: "application",
            related_project_id: projectId,
            sender_id: user.id,
          },
        ]);

      if (notificationError) {
        console.error("Application notification failed:", notificationError);
      }

      setSuccess(true);
    } catch (err: unknown) {
      console.error("Application submission failed:", err);

      setErrors({
        general:
          "Something went wrong submitting your application. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 size={28} className="animate-spin text-[#00AFEF]" />
      </div>
    );
  }

  if (!project || !position) return null;

  // Success screen
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-surface p-10 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#00AFEF]/20 bg-[#00AFEF]/10">
            <CheckCircle2 size={36} className="text-[#00AFEF]" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              Application Sent!
            </h2>

            <p className="text-sm text-muted">
              Your application for{" "}
              <span className="font-medium text-foreground">
                {position.title}
              </span>{" "}
              on{" "}
              <span className="font-medium text-foreground">
                {project.title}
              </span>{" "}
              has been submitted. The project manager will review it and get
              back to you.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/projects"
              className="w-full rounded-xl bg-[#00AFEF] py-3 text-center text-sm font-semibold text-slate-950 transition-colors hover:bg-[#00AFEF]/80"
            >
              Back to Projects
            </Link>

            <Link
              href={`/apply/${projectId}`}
              className="w-full rounded-xl border border-border py-3 text-center text-sm text-muted transition-colors hover:bg-surface-secondary hover:text-foreground"
            >
              View Other Positions
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-background text-foreground transition-all duration-500 ease-in-out ${
        isSidebarHovered ? "ml-16" : "ml-0"
      }`}
      style={{
        transform: isSidebarHovered ? "scale(1.005)" : "scale(1)",
        filter: isSidebarHovered ? "brightness(0.98)" : "brightness(1)",
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
        {/* Back */}
        <Link
          href={`/apply/${projectId}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft size={15} />
          Back to Positions
        </Link>

        {/* Header */}
        <div className="space-y-3 rounded-2xl border border-border bg-surface px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface-secondary">
              <Briefcase size={18} className="text-[#00AFEF]" />
            </div>

            <div>
              <p className="text-xs text-muted">{project.title}</p>
              <h1 className="text-xl font-bold text-foreground">
                {position.title}
              </h1>
            </div>
          </div>

          {position.description && (
            <p className="text-sm leading-relaxed text-muted">
              {position.description}
            </p>
          )}
        </div>

        {/* General error */}
        {errors.general && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500 dark:text-red-300">
            {errors.general}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className={labelClass}>
              Full Name <span className="text-red-500">*</span>
            </label>

            <input
              type="text"
              value={form.fullName}
              onChange={(e) => {
                setForm((prev) => ({
                  ...prev,
                  fullName: e.target.value,
                }));
                setErrors((prev) => ({
                  ...prev,
                  fullName: undefined,
                }));
              }}
              placeholder="Your full name"
              maxLength={80}
              className={`${inputBase} ${
                errors.fullName ? inputError : inputNormal
              }`}
            />

            {errors.fullName && (
              <p className="text-xs text-red-500">{errors.fullName}</p>
            )}
          </div>

          {/* Experience */}
          <div className="space-y-1.5">
            <label className={labelClass}>
              Relevant Experience <span className="text-red-500">*</span>
            </label>

            <textarea
              rows={5}
              value={form.experience}
              onChange={(e) => {
                setForm((prev) => ({
                  ...prev,
                  experience: e.target.value,
                }));
                setErrors((prev) => ({
                  ...prev,
                  experience: undefined,
                }));
              }}
              placeholder="Describe your relevant experience, previous projects, and background..."
              className={`${inputBase} resize-none ${
                errors.experience ? inputError : inputNormal
              }`}
            />

            {errors.experience && (
              <p className="text-xs text-red-500">{errors.experience}</p>
            )}
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <label className={labelClass}>
              Skills <span className="text-red-500">*</span>
            </label>

            <div
              className={`flex min-h-[52px] flex-wrap items-center gap-2 rounded-xl border bg-surface-secondary px-4 py-3 transition-colors focus-within:border-[#00AFEF]/50 ${
                errors.skills ? inputError : "border-border"
              }`}
            >
              {form.skills.map((skill) => (
                <span
                  key={skill}
                  className="flex items-center gap-1.5 rounded-lg border border-[#00AFEF]/20 bg-[#00AFEF]/10 px-3 py-1 text-xs font-medium text-[#00AFEF]"
                >
                  {skill}

                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    aria-label={`Remove ${skill}`}
                    className="text-[#00AFEF]/60 transition-colors hover:text-red-500"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}

              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                placeholder={
                  form.skills.length === 0
                    ? "Type a skill and press Enter..."
                    : "Add more..."
                }
                className="min-w-[140px] flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted/50"
              />
            </div>

            {errors.skills && (
              <p className="text-xs text-red-500">{errors.skills}</p>
            )}
          </div>

          {/* Portfolio Links */}
          <div className="space-y-2">
            <label className={labelClass}>
              Portfolio / Links{" "}
              <span className="text-muted/70">
                (optional — up to 3)
              </span>
            </label>

            {form.portfolioLinks.map((link, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="url"
                  value={link}
                  onChange={(e) => updatePortfolioLink(i, e.target.value)}
                  placeholder="https://github.com/yourname or portfolio link"
                  className={`${inputBase} ${inputNormal} flex-1`}
                />

                {form.portfolioLinks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePortfolioLink(i)}
                    aria-label="Remove portfolio link"
                    className="text-muted transition-colors hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}

            {form.portfolioLinks.length < 3 && (
              <button
                type="button"
                onClick={addPortfolioLink}
                className="flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-foreground"
              >
                <Plus size={13} />
                Add another link
              </button>
            )}
          </div>

          {/* Motivation */}
          <div className="space-y-1.5">
            <label className={labelClass}>
              Why do you want to join this project?{" "}
              <span className="text-red-500">*</span>
            </label>

            <textarea
              rows={5}
              value={form.motivation}
              onChange={(e) => {
                setForm((prev) => ({
                  ...prev,
                  motivation: e.target.value,
                }));
                setErrors((prev) => ({
                  ...prev,
                  motivation: undefined,
                }));
              }}
              placeholder="Tell the project manager why you're excited about this project and what you'll bring to the team..."
              maxLength={1000}
              className={`${inputBase} resize-none ${
                errors.motivation ? inputError : inputNormal
              }`}
            />

            <div className="flex items-center justify-between px-1">
              {errors.motivation ? (
                <p className="text-xs text-red-500">
                  {errors.motivation}
                </p>
              ) : (
                <span />
              )}

              <span
                className={`text-xs ${
                  form.motivation.length >= 900
                    ? "text-red-500"
                    : "text-muted"
                }`}
              >
                {form.motivation.length}/1000
              </span>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-[#00AFEF] py-3.5 text-sm font-semibold text-slate-950 transition-all hover:bg-[#00AFEF]/80 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Submitting...
              </span>
            ) : (
              `Submit Application for ${position.title}`
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
