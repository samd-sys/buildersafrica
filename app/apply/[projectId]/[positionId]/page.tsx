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
    errors.experience = "Please describe your experience (at least 20 characters).";
  if (form.skills.length === 0)
    errors.skills = "Please add at least one skill.";
  if (!form.motivation.trim() || form.motivation.trim().length < 20)
    errors.motivation = "Please tell us why you want to join (at least 20 characters).";
  return errors;
}

export default function ApplicationFormPage() {
  const params = useParams();
  const router = useRouter();
  const projectId  = params?.projectId  as string;
  const positionId = params?.positionId as string;

  const [project,  setProject]  = useState<Project | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [errors,   setErrors]   = useState<FormErrors>({});
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
    const handleSidebarHover = (event: CustomEvent) => {
      setIsSidebarHovered(event.detail.isHovered);
    };
    window.addEventListener("sidebarHover", handleSidebarHover as EventListener);
    return () =>
      window.removeEventListener("sidebarHover", handleSidebarHover as EventListener);
  }, []);

  useEffect(() => {
    if (projectId && positionId) loadPage();
  }, [projectId, positionId]);

  const loadPage = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    // Load project
    const { data: proj } = await supabase
      .from("projects")
      .select("id, title, description, logo_url, user_id, team_needs")
      .eq("id", projectId)
      .single();

    if (!proj) { router.push("/projects"); return; }

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

    if (!pos) { router.push(`/apply/${projectId}`); return; }
    setPosition(pos);

    // Block duplicate applications
    const { data: existing } = await supabase
      .from("project_applications")
      .select("id")
      .eq("project_id", projectId)
      .eq("position_id", positionId)
      .eq("applicant_id", user.id)
      .maybeSingle();

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

    setForm((prev) => ({
      ...prev,
      fullName: profile?.full_name || "",
    }));

    setLoading(false);
  };

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed || form.skills.includes(trimmed)) return;
    setForm((prev) => ({ ...prev, skills: [...prev.skills, trimmed] }));
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
      return { ...prev, portfolioLinks: links };
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated.");

      // Clean portfolio links — remove empty ones
      const cleanLinks = form.portfolioLinks
        .map((l) => l.trim())
        .filter(Boolean);

      // Insert application
      const { error: insertError } = await supabase
        .from("project_applications")
        .insert([{
          project_id:      projectId,
          position_id:     positionId,
          applicant_id:    user.id,
          full_name:       form.fullName.trim(),
          experience:      form.experience.trim(),
          skills:          form.skills,
          portfolio_links: cleanLinks,
          motivation:      form.motivation.trim(),
          status:          "pending",
        }]);

      if (insertError) throw insertError;

      // Notify project manager
      await supabase.from("notifications").insert([{
        user_id:            project!.user_id,
        title:              "New Application",
        message:            `${form.fullName.trim()} has applied for the ${position!.title} position on your project: ${project!.title}`,
        type:               "application",
        related_project_id: projectId,
        sender_id:          user.id,
      }]);

      setSuccess(true);
    } catch (err: unknown) {
      setErrors({
        general: "Something went wrong submitting your application. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#00AFEF]" />
      </div>
    );
  }

  if (!project || !position) return null;

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-[#1F1F23] bg-[#0F0F11] p-10 text-center space-y-6">
          <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-full bg-[#00AFEF]/10 border border-[#00AFEF]/20">
            <CheckCircle2 size={36} className="text-[#00AFEF]" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Application Sent!</h2>
            <p className="text-sm text-gray-400">
              Your application for{" "}
              <span className="text-white font-medium">{position.title}</span>{" "}
              on{" "}
              <span className="text-white font-medium">{project.title}</span>{" "}
              has been submitted. The project manager will review it and get back to you.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href="/projects"
              className="w-full rounded-xl bg-[#00AFEF] py-3 text-sm font-semibold text-slate-950 hover:bg-[#00AFEF]/80 transition-colors text-center"
            >
              Back to Projects
            </Link>
            <Link
              href={`/apply/${projectId}`}
              className="w-full rounded-xl border border-[#1F1F23] py-3 text-sm text-gray-400 hover:text-white transition-colors text-center"
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
      className={`min-h-screen bg-[#09090B] text-white transition-all duration-500 ease-in-out ${
        isSidebarHovered ? "ml-16" : "ml-0"
      }`}
      style={{
        transform: isSidebarHovered ? "scale(1.005)" : "scale(1)",
        filter: isSidebarHovered ? "brightness(0.98)" : "brightness(1)",
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <div className="mx-auto max-w-2xl px-4 py-10 space-y-6">

        {/* Back */}
        <Link
          href={`/apply/${projectId}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={15} />
          Back to Positions
        </Link>

        {/* Header */}
        <div className="rounded-2xl border border-[#1F1F23] bg-[#0F0F11] px-6 py-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#1F1F23] bg-[#121215]">
              <Briefcase size={18} className="text-[#00AFEF]" />
            </div>
            <div>
              <p className="text-xs text-gray-500">{project.title}</p>
              <h1 className="text-xl font-bold text-white">{position.title}</h1>
            </div>
          </div>
          {position.description && (
            <p className="text-sm text-gray-400 leading-relaxed">
              {position.description}
            </p>
          )}
        </div>

        {/* General error */}
        {errors.general && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-300">
            {errors.general}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, fullName: e.target.value }));
                setErrors((prev) => ({ ...prev, fullName: undefined }));
              }}
              placeholder="Your full name"
              maxLength={80}
              className={`w-full rounded-xl border bg-[#121215] px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none transition-colors ${
                errors.fullName ? "border-red-500/60" : "border-[#1F1F23] focus:border-[#00AFEF]/50"
              }`}
            />
            {errors.fullName && (
              <p className="text-xs text-red-400">{errors.fullName}</p>
            )}
          </div>

          {/* Experience */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400">
              Relevant Experience <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={5}
              value={form.experience}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, experience: e.target.value }));
                setErrors((prev) => ({ ...prev, experience: undefined }));
              }}
              placeholder="Describe your relevant experience, previous projects, and background..."
              className={`w-full resize-none rounded-xl border bg-[#121215] px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none transition-colors ${
                errors.experience ? "border-red-500/60" : "border-[#1F1F23] focus:border-[#00AFEF]/50"
              }`}
            />
            {errors.experience && (
              <p className="text-xs text-red-400">{errors.experience}</p>
            )}
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400">
              Skills <span className="text-red-400">*</span>
            </label>
            <div className={`min-h-[52px] rounded-xl border bg-[#121215] px-4 py-3 flex flex-wrap gap-2 items-center focus-within:border-[#00AFEF]/50 transition-colors ${
              errors.skills ? "border-red-500/60" : "border-[#1F1F23]"
            }`}>
              {form.skills.map((skill) => (
                <span
                  key={skill}
                  className="flex items-center gap-1.5 rounded-lg border border-[#00AFEF]/20 bg-[#00AFEF]/10 px-3 py-1 text-xs font-medium text-[#00AFEF]"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="text-[#00AFEF]/60 hover:text-red-400 transition-colors"
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
                  if (e.key === "Enter") { e.preventDefault(); addSkill(); }
                }}
                placeholder={form.skills.length === 0 ? "Type a skill and press Enter..." : "Add more..."}
                className="flex-1 min-w-[140px] bg-transparent text-sm text-white placeholder:text-white/25 outline-none"
              />
            </div>
            {errors.skills && (
              <p className="text-xs text-red-400">{errors.skills}</p>
            )}
          </div>

          {/* Portfolio Links */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400">
              Portfolio / Links{" "}
              <span className="text-gray-600">(optional — up to 3)</span>
            </label>
            {form.portfolioLinks.map((link, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="url"
                  value={link}
                  onChange={(e) => updatePortfolioLink(i, e.target.value)}
                  placeholder="https://github.com/yourname or portfolio link"
                  className="flex-1 rounded-xl border border-[#1F1F23] bg-[#121215] px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-[#00AFEF]/50 transition-colors"
                />
                {form.portfolioLinks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePortfolioLink(i)}
                    className="text-gray-600 hover:text-red-400 transition-colors"
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
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors"
              >
                <Plus size={13} />
                Add another link
              </button>
            )}
          </div>

          {/* Motivation */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400">
              Why do you want to join this project?{" "}
              <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={5}
              value={form.motivation}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, motivation: e.target.value }));
                setErrors((prev) => ({ ...prev, motivation: undefined }));
              }}
              placeholder="Tell the project manager why you're excited about this project and what you'll bring to the team..."
              maxLength={1000}
              className={`w-full resize-none rounded-xl border bg-[#121215] px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none transition-colors ${
                errors.motivation ? "border-red-500/60" : "border-[#1F1F23] focus:border-[#00AFEF]/50"
              }`}
            />
            <div className="flex items-center justify-between px-1">
              {errors.motivation ? (
                <p className="text-xs text-red-400">{errors.motivation}</p>
              ) : <span />}
              <span className={`text-xs ${form.motivation.length >= 900 ? "text-red-400" : "text-gray-600"}`}>
                {form.motivation.length}/1000
              </span>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-[#00AFEF] py-3.5 text-sm font-semibold text-slate-950 transition-all hover:bg-[#00AFEF]/80 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
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