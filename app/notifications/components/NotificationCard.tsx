import { useState } from "react";
import { X, Loader2, Check, XCircle } from "lucide-react";
import { Notification, TYPE_META, DEFAULT_META } from "../types";

type Props = {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onAcceptInvite: (id: string, projectId: string) => Promise<void>;
  onRejectInvite: (id: string) => Promise<void>;
  onAcceptApplication: (id: string, senderId: string, projectId: string) => Promise<void>;
  onRejectApplication: (id: string, senderId: string, projectId: string) => Promise<void>;
};

function formatTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function NotificationCard({
  notification: n,
  onRead,
  onDelete,
  onAcceptInvite,
  onRejectInvite,
  onAcceptApplication,
  onRejectApplication,
}: Props) {
  const [isActing, setIsActing] = useState(false);
  const [actionDone, setActionDone] = useState<"accepted" | "rejected" | null>(null);
  const meta = TYPE_META[n.type] ?? DEFAULT_META;
  const isInvite = n.type === "invite" || n.type === "connection_request";
  const isApplication = n.type === "application";

  const handleAcceptInvite = async () => {
    setIsActing(true);
    await onAcceptInvite(n.id, n.related_project_id ?? "");
    setIsActing(false);
  };

  const handleRejectInvite = async () => {
    setIsActing(true);
    await onRejectInvite(n.id);
    setIsActing(false);
  };

  const handleAcceptApplication = async () => {
    setIsActing(true);
    await onAcceptApplication(
      n.id,
      n.sender_id ?? "",
      n.related_project_id ?? ""
    );
    setActionDone("accepted");
    setIsActing(false);
  };

  const handleRejectApplication = async () => {
    setIsActing(true);
    await onRejectApplication(
      n.id,
      n.sender_id ?? "",
      n.related_project_id ?? ""
    );
    setActionDone("rejected");
    setIsActing(false);
  };

  return (
    <div
      onClick={() => !n.is_read && onRead(n.id)}
      className={`group relative flex gap-4 rounded-xl border p-4 transition-all duration-150 cursor-pointer ${
        n.is_read
          ? "border-[#1F1F23] bg-[#121215]"
          : "border-[#00AFEF] bg-[#00AFEF]/[0.04] hover:bg-[#00AFEF]/[0.07]"
      }`}
    >
      {/* Unread dot */}
      {!n.is_read && (
        <span className="absolute top-4 right-10 h-2 w-2 rounded-full bg-[#00AFEF] shrink-0" />
      )}

      {/* Type icon */}
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-lg ${meta.color}`}
      >
        {meta.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        {n.title && (
          <p className={`text-sm font-semibold leading-tight ${n.is_read ? "text-gray-300" : "text-white"}`}>
            {n.title}
          </p>
        )}
        <p className={`text-xs leading-relaxed ${n.is_read ? "text-gray-500" : "text-gray-400"}`}>
          {n.message}
        </p>
        <p className="text-[11px] text-gray-600">{formatTime(n.created_at)}</p>

        {/* Accept / Reject for invites */}
        {isInvite && !n.is_read && (
          <div className="flex items-center gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleAcceptInvite}
              disabled={isActing}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-60"
            >
              {isActing ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
              Accept
            </button>
            <button
              onClick={handleRejectInvite}
              disabled={isActing}
              className="flex items-center gap-1.5 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-60"
            >
              {isActing ? <Loader2 size={11} className="animate-spin" /> : <XCircle size={11} />}
              Decline
            </button>
          </div>
        )}

        {/* Accept / Reject for applications */}
        {isApplication && !n.is_read && !actionDone && (
          <div className="flex items-center gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleAcceptApplication}
              disabled={isActing || !n.sender_id}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-60"
            >
              {isActing ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
              Accept
            </button>
            <button
              onClick={handleRejectApplication}
              disabled={isActing || !n.sender_id}
              className="flex items-center gap-1.5 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-60"
            >
              {isActing ? <Loader2 size={11} className="animate-spin" /> : <XCircle size={11} />}
              Reject
            </button>
          </div>
        )}

        {/* Post-action feedback */}
        {isApplication && actionDone && (
          <div className={`flex items-center gap-1.5 pt-2 text-xs font-medium ${
            actionDone === "accepted" ? "text-emerald-400" : "text-red-400"
          }`}>
            {actionDone === "accepted" ? <Check size={11} /> : <XCircle size={11} />}
            Application {actionDone === "accepted" ? "accepted — builder added to team" : "rejected"}
          </div>
        )}
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(n.id); }}
        className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-md text-gray-600 opacity-0 group-hover:opacity-100 hover:bg-white/5 hover:text-red-400 transition-all"
        title="Delete notification"
      >
        <X size={13} />
      </button>
    </div>
  );
}