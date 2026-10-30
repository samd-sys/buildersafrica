
"use client";

import { useState } from "react";
import { X, Loader2, Check, XCircle } from "lucide-react";
import { Notification, TYPE_META, DEFAULT_META } from "../types";

type Props = {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onAcceptInvite: (id: string, projectId: string) => Promise<void>;
  onRejectInvite: (id: string) => Promise<void>;
  onAcceptApplication: (
    id: string,
    senderId: string,
    projectId: string
  ) => Promise<void>;
  onRejectApplication: (
    id: string,
    senderId: string,
    projectId: string
  ) => Promise<void>;
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

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
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
  const [actionDone, setActionDone] = useState<
    "accepted" | "rejected" | null
  >(null);

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
      className={`group relative flex cursor-pointer gap-4 rounded-xl border p-4 transition-all duration-150 ${
        n.is_read
          ? "border-border bg-surface"
          : "border-[#00AFEF] bg-[#00AFEF]/[0.04] hover:bg-[#00AFEF]/[0.08]"
      }`}
    >
      {/* Unread dot */}
      {!n.is_read && (
        <span className="absolute right-10 top-4 h-2 w-2 shrink-0 rounded-full bg-[#00AFEF]" />
      )}

      {/* Type icon */}
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-lg ${meta.color}`}
      >
        {meta.icon}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-1">
        {n.title && (
          <p
            className={`text-sm font-semibold leading-tight ${
              n.is_read ? "text-muted" : "text-foreground"
            }`}
          >
            {n.title}
          </p>
        )}

        <p
          className={`text-xs leading-relaxed ${
            n.is_read ? "text-muted" : "text-foreground"
          }`}
        >
          {n.message}
        </p>

        <p className="text-[11px] text-muted">
          {formatTime(n.created_at)}
        </p>

        {/* Accept / Reject for invites */}
        {isInvite && !n.is_read && (
          <div
            className="flex items-center gap-2 pt-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleAcceptInvite}
              disabled={isActing}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-500 transition-colors hover:bg-emerald-500/20 disabled:opacity-60"
            >
              {isActing ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <Check size={11} />
              )}
              Accept
            </button>

            <button
              type="button"
              onClick={handleRejectInvite}
              disabled={isActing}
              className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-500 transition-colors hover:bg-red-500/20 disabled:opacity-60"
            >
              {isActing ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <XCircle size={11} />
              )}
              Decline
            </button>
          </div>
        )}

        {/* Accept / Reject for applications */}
        {isApplication && !n.is_read && !actionDone && (
          <div
            className="flex items-center gap-2 pt-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleAcceptApplication}
              disabled={isActing || !n.sender_id}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-500 transition-colors hover:bg-emerald-500/20 disabled:opacity-60"
            >
              {isActing ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <Check size={11} />
              )}
              Accept
            </button>

            <button
              type="button"
              onClick={handleRejectApplication}
              disabled={isActing || !n.sender_id}
              className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-500 transition-colors hover:bg-red-500/20 disabled:opacity-60"
            >
              {isActing ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <XCircle size={11} />
              )}
              Reject
            </button>
          </div>
        )}

        {/* Post-action feedback */}
        {isApplication && actionDone && (
          <div
            className={`flex items-center gap-1.5 pt-2 text-xs font-medium ${
              actionDone === "accepted"
                ? "text-emerald-500"
                : "text-red-500"
            }`}
          >
            {actionDone === "accepted" ? (
              <Check size={11} />
            ) : (
              <XCircle size={11} />
            )}

            Application{" "}
            {actionDone === "accepted"
              ? "accepted — builder added to team"
              : "rejected"}
          </div>
        )}
      </div>

      {/* Delete button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(n.id);
        }}
        aria-label="Delete notification"
        title="Delete notification"
        className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-md text-muted opacity-0 transition-all hover:bg-surface-secondary hover:text-red-500 group-hover:opacity-100"
      >
        <X size={13} />
      </button>
    </div>
  );
}
