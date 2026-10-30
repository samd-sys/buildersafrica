
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Send,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";

const FAQS = [
  {
    question: "How do I make my profile visible to other builders?",
    answer:
      "Go to Profile Settings and toggle the 'Make your profile public' switch to On. You can also choose which regions your profile is visible in by selecting the checkboxes below the toggle.",
  },
  {
    question: "How do I apply to collaborate on a project?",
    answer:
      "Browse projects on the Projects page and click on any project card to open its details. If the project has open positions, you'll see a 'View Open Positions & Apply' button. Click it to see available roles and submit your application.",
  },
  {
    question: "How do I create a team chat for my project?",
    answer:
      "Go to My Projects, click the Team button on your project, then click 'Create Team Chat' in the team header. All team members will be notified and can access it from the Messages page under the Group tab.",
  },
  {
    question: "How do I accept or reject applications to my project?",
    answer:
      "Go to My Projects → Team → View Applications. You'll see all pending applications. Click any application to expand it and see the applicant's details, then use the Accept or Reject buttons.",
  },
  {
    question: "Can I message someone I'm not connected with?",
    answer:
      "Yes — you can send a message request to any builder. Find them on the Builders page and click Message. They'll receive a request notification and can choose to accept, decline, or block it.",
  },
  {
    question: "How do I change my profile photo?",
    answer:
      "Go to Profile Settings and click on your avatar in the right-hand preview panel. This opens a file picker — select a photo from your device and it will upload and update automatically.",
  },
  {
    question: "What happens when my application is accepted?",
    answer:
      "You'll receive a notification in your Notifications page under the Applications tab. You'll be added to the project team and can access the team chat from the Messages page.",
  },
  {
    question: "How do I delete my account?",
    answer:
      "Go to Profile Settings → Remove Account in the left navigation. You'll need to confirm by typing DELETE. This action is permanent and cannot be undone.",
  },
];

const SUBJECTS = [
  "Bug Report",
  "Account Issue",
  "Billing Question",
  "Feature Request",
  "Content Issue",
  "Other",
];

export default function SupportCenter() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!subject) {
      setError("Please select a subject.");
      return;
    }

    if (!message.trim() || message.trim().length < 20) {
      setError("Please describe your issue in at least 20 characters.");
      return;
    }

    setStatus("loading");
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in.");
      setStatus("error");
      return;
    }

    const { error: insertError } = await supabase
      .from("support_tickets")
      .insert([
        {
          user_id: user.id,
          subject,
          message: message.trim(),
          status: "open",
        },
      ]);

    if (insertError) {
      setError("Failed to submit ticket. Please try again.");
      setStatus("error");
    } else {
      setStatus("success");
      setSubject("");
      setMessage("");
    }
  };

  return (
    <div className="space-y-8 bg-background p-8">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-foreground">
          Support Center
        </h2>
        <p className="text-sm text-muted">
          Find answers to common questions or get in touch with our team.
        </p>
      </div>

      {/* FAQ */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="flex items-center gap-2 border-b border-border px-6 py-4">
          <HelpCircle size={16} className="text-[#00AFEF]" />
          <h3 className="text-sm font-semibold text-foreground">
            Frequently Asked Questions
          </h3>
        </div>

        <div className="divide-y divide-border">
          {FAQS.map((faq, i) => (
            <div key={i}>
              <button
                type="button"
                aria-expanded={openFaq === i}
                onClick={() =>
                  setOpenFaq(openFaq === i ? null : i)
                }
                className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition-colors hover:bg-surface-secondary"
              >
                <p className="text-sm font-medium text-foreground">
                  {faq.question}
                </p>

                {openFaq === i ? (
                  <ChevronUp
                    size={16}
                    className="shrink-0 text-[#00AFEF]"
                  />
                ) : (
                  <ChevronDown
                    size={16}
                    className="shrink-0 text-muted"
                  />
                )}
              </button>

              {openFaq === i && (
                <div className="px-6 pb-4">
                  <p className="text-sm leading-relaxed text-muted">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact Form */}
      <div className="space-y-5 rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-center gap-2">
          <Send size={16} className="text-[#00AFEF]" />
          <h3 className="text-sm font-semibold text-foreground">
            Contact Support
          </h3>
        </div>

        <p className="text-xs text-muted">
          Can't find what you're looking for? Send us a message and we'll
          get back to you as soon as possible.
        </p>

        {status === "success" ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
              <Check size={20} className="text-emerald-400" />
            </div>

            <p className="text-sm font-semibold text-foreground">
              Ticket submitted!
            </p>

            <p className="text-xs text-muted">
              We'll review your message and get back to you shortly.
            </p>

            <button
              type="button"
              onClick={() => setStatus("idle")}
              className="mt-2 text-xs text-[#00AFEF] hover:underline"
            >
              Submit another ticket
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Subject */}
            <div className="space-y-1.5">
              <label
                htmlFor="support-subject"
                className="text-xs text-muted"
              >
                Subject
              </label>

              <select
                id="support-subject"
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setError("");
                }}
                className="w-full rounded-xl border border-border bg-surface-secondary px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-[#00AFEF]/60"
              >
                <option value="">Select a subject...</option>

                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <label
                htmlFor="support-message"
                className="text-xs text-muted"
              >
                Message
              </label>

              <textarea
                id="support-message"
                rows={5}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setError("");
                }}
                placeholder="Describe your issue in detail..."
                maxLength={2000}
                className="w-full resize-none rounded-xl border border-border bg-surface-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted/60 outline-none transition-colors focus:border-[#00AFEF]/60"
              />

              <div className="flex items-center justify-between px-1">
                {error ? (
                  <p
                    role="alert"
                    className="flex items-center gap-1.5 text-xs text-red-400"
                  >
                    <AlertCircle size={11} />
                    {error}
                  </p>
                ) : (
                  <span />
                )}

                <span
                  className={`text-xs ${
                    message.length >= 1800
                      ? "text-red-400"
                      : "text-muted"
                  }`}
                >
                  {message.length}/2000
                </span>
              </div>
            </div>

            {/* Submit */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={status === "loading"}
              className="flex items-center gap-2 rounded-xl bg-[#00AFEF] px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-[#00AFEF]/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === "loading" ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={14} />
                  Submit Ticket
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
