
import { useState } from "react";
import {
  User, Link2, Check, X, Loader2,
  ChevronDown, ChevronUp,
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
      day: "numeric", month: "short", year: "numeric",
    });
  } catch { return "—"; }
}

const STATUS_STYLE: Record<string, string> = {
  pending:  "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  accepted: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  rejected: "text-red-400 bg-red-400/10 border-red-400/20",
};

export default function ApplicationCard({ application: app, onAccept, onReject }: Props) {
  const [expanded, setExpanded]   = useState(false);
  const [isActing, setIsActing]   = useState(false);
  const [actionDone, setActionDone] = useState<"accepted" | "rejected" | null>(null);

  const currentStatus = actionDone ?? app.status;

  const handleAccept = async () => {
    setIsActing(true);
    await onAccept(app);
    setActionDone("accepted");
    setIsActing(false);
  };

  const handleReject = async () => {
    setIsActing(true);
    await onReject(app);
    setActionDone("rejected");
    setIsActing(false);
  };

  return (
    <div className="rounded-2xl border border-[#1F1F23] bg-[#121215] overflow-hidden">
      {/* Card header */}
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Avatar */}
        <div className="h-10 w-10 rounded-full overflow-hidden border border-[#27272A] bg-[#18181B] flex items-center justify-center shrink-0">
          {app.applicant_avatar ? (
            <img src={app.applicant_avatar} alt={app.applicant_name} className="h-full w-full object-cover" />
          ) : (
            <User size={16} className="text-gray-600" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {app.applicant_name || app.full_name}
          </p>
          <p className="text-xs text-gray-500">
            Applied for <span className="text-[#00AFEF]">{app.position_title}</span>
            {" · "}{formatDate(app.created_at)}
          </p>
        </div>

        {/* Status badge */}
        <span className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold capitalize ${STATUS_STYLE[currentStatus]}`}>
          {currentStatus}
        </span>

        {/* Expand toggle */}
        <button className="text-gray-500 hover:text-white transition-colors shrink-0">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-5 pb-5 space-y-5 border-t border-[#1F1F23]">
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Experience */}
            {app.experience && (
              <div className="space-y-1.5 sm:col-span-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  Experience
                </p>
                <p className="text-sm text-gray-300 leading-relaxed bg-[#0F0F11] rounded-xl px-4 py-3 border border-[#1F1F23]">
                  {app.experience}
                </p>
              </div>
            )}

            {/* Skills */}
            {app.skills && app.skills.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
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
            {app.portfolio_links && app.portfolio_links.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  Links
                </p>
                <div className="space-y-1.5">
                  {app.portfolio_links.filter(Boolean).map((link, i) => (
                    <a
                      key={i}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors truncate"
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
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  Why they want to join
                </p>
                <p className="text-sm text-gray-300 leading-relaxed bg-[#0F0F11] rounded-xl px-4 py-3 border border-[#1F1F23] italic">
                  "{app.motivation}"
                </p>
              </div>
            )}
          </div>

          {/* Action buttons — only show if still pending */}
          {currentStatus === "pending" && (
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleAccept}
                disabled={isActing}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 py-2.5 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-60"
              >
                {isActing ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Accept
              </button>
              <button
                onClick={handleReject}
                disabled={isActing}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-60"
              >
                {isActing ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                Reject
              </button>
            </div>
          )}

          {/* Post-action feedback */}
          {actionDone && (
            <div className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold border ${
              actionDone === "accepted"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}>
              {actionDone === "accepted" ? <Check size={14} /> : <X size={14} />}
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