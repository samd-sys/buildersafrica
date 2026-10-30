
"use client";

import { useState } from "react";
import {
  User,
  Link2,
  Check,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Application } from "../../../apply/[projectId]/types";

type Props = {
  application: Application;
  onAccept: (app: Application) => Promise<void>;
  onReject: (app: Application) => Promise<void>;
};

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

const STATUS_STYLE: Record<string, string> = {
  pending:
    "text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  accepted:
    "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  rejected:
    "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20",
};

export default function ApplicationCard({
  application: app,
  onAccept,
  onReject,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [isActing, setIsActing] = useState(false);
  const [actionDone, setActionDone] = useState<
    "accepted" | "rejected" | null
  >(null);

  const currentStatus = actionDone ?? app.status;

  const handleAccept = async () => {
    setIsActing(true);

    try {
      await onAccept(app);
      setActionDone("accepted");
    } catch (error) {
      console.error("Error accepting application:", error);
      alert("Could not accept this application. Please try again.");
    } finally {
      setIsActing(false);
    }
  };

  const handleReject = async () => {
    setIsActing(true);

    try {
      await onReject(app);
      setActionDone("rejected");
    } catch (error) {
      console.error("Error rejecting application:", error);
      alert("Could not reject this application. Please try again.");
    } finally {
      setIsActing(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">

      {/* Card header */}
      <div
        className="flex cursor-pointer items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-secondary"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Avatar */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-secondary">
          {app.applicant_avatar ? (
            <img
              src={app.applicant_avatar}
              alt={app.applicant_name || app.full_name || "Applicant"}
              className="h-full w-full object-cover"
            />
          ) : (
            <User size={16} className="text-muted" />
          )}
        </div>

        {/* Applicant information */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {app.applicant_name || app.full_name}
          </p>

          <p className="text-xs text-muted">
            Applied for{" "}
            <span className="text-[#00AFEF]">
              {app.position_title}
            </span>
            {" · "}
            {formatDate(app.created_at)}
          </p>
        </div>

        {/* Status badge */}
        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold capitalize ${
            STATUS_STYLE[currentStatus] ??
            "border-border bg-surface-secondary text-muted"
          }`}
        >
          {currentStatus}
        </span>

        {/* Expand toggle */}
        <button
          type="button"
          aria-label={expanded ? "Collapse application" : "Expand application"}
          aria-expanded={expanded}
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          className="shrink-0 text-muted transition-colors hover:text-foreground"
        >
          {expanded ? (
            <ChevronUp size={16} />
          ) : (
            <ChevronDown size={16} />
          )}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="space-y-5 border-t border-border px-5 pb-5">

          <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2">

            {/* Experience */}
            {app.experience && (
              <div className="space-y-1.5 sm:col-span-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Experience
                </p>

                <p className="rounded-xl border border-border bg-surface-secondary px-4 py-3 text-sm leading-relaxed text-foreground">
                  {app.experience}
                </p>
              </div>
            )}

            {/* Skills */}
            {app.skills && app.skills.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Skills
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {app.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-lg border border-[#00AFEF]/20 bg-[#00AFEF]/10 px-2.5 py-1 text-xs font-medium text-[#00AFEF]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio links */}
            {app.portfolio_links &&
              app.portfolio_links.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Links
                  </p>

                  <div className="space-y-1.5">
                    {app.portfolio_links.filter(Boolean).map((link, i) => (
                      <a
                        key={i}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 truncate text-xs text-muted transition-colors hover:text-[#00AFEF]"
                      >
                        <Link2 size={12} className="shrink-0" />
                        {link}
                      </a>
                    ))}
                  </div>
                </div>
              )}

            {/* Motivation */}
            {app.motivation && (
              <div className="space-y-1.5 sm:col-span-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Why they want to join
                </p>

                <p className="rounded-xl border border-border bg-surface-secondary px-4 py-3 text-sm italic leading-relaxed text-foreground">
                  "{app.motivation}"
                </p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          {currentStatus === "pending" && (
            <div className="flex items-center gap-3 pt-2">

              <button
                type="button"
                onClick={handleAccept}
                disabled={isActing}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 py-2.5 text-sm font-semibold text-emerald-600 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:text-emerald-400"
              >
                {isActing ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Check size={14} />
                )}
                Accept
              </button>

              <button
                type="button"
                onClick={handleReject}
                disabled={isActing}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-400"
              >
                {isActing ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <X size={14} />
                )}
                Reject
              </button>
            </div>
          )}

          {/* Post-action feedback */}
          {actionDone && (
            <div
              className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold ${
                actionDone === "accepted"
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400"
              }`}
            >
              {actionDone === "accepted" ? (
                <Check size={14} />
              ) : (
                <X size={14} />
              )}

              {actionDone === "accepted"
                ? "Accepted — builder added to team"
                : "Application rejected"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
