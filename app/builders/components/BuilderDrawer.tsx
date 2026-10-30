
"use client";

import { useEffect, useState } from "react";
import {
  X,
  User,
  Link2,
  ExternalLink,
  Globe,
  CalendarDays,
  UserPlus,
  FolderPlus,
  Loader2,
  Check,
  MessageSquare,
} from "lucide-react";
import { Builder, ConnectionStatus } from "../types/builder";
import { countryToFlag } from "../lib/countryFlag";
import { supabase } from "@/lib/supabase";
import SendMessageModal from "@/app/messages/components/SendMessageModal";

type Props = {
  builder: Builder | null;
  onClose: () => void;
};

export default function BuilderDrawer({ builder, onClose }: Props) {
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("none");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteDone, setInviteDone] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);

  useEffect(() => {
    if (!builder) return;
    setInviteDone(false);
    loadConnectionStatus();
  }, [builder?.user_id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const loadConnectionStatus = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !builder) return;

    const { data } = await supabase
      .from("connections")
      .select("status")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${builder.user_id}),` +
          `and(sender_id.eq.${builder.user_id},receiver_id.eq.${user.id})`
      )
      .maybeSingle();

    setConnectionStatus((data?.status as ConnectionStatus) || "none");
  };

  const handleConnect = async () => {
    if (connectionStatus !== "none") return;
    setIsConnecting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("You must be logged in.");
      setIsConnecting(false);
      return;
    }

    const { error } = await supabase.from("connections").insert([
      {
        sender_id: user.id,
        receiver_id: builder!.user_id,
        status: "pending",
      },
    ]);

    if (error) {
      alert(error.message);
    } else {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single();

      const senderName = profile?.full_name || user.email || "Someone";

      await supabase.from("notifications").insert([
        {
          user_id: builder!.user_id,
          title: "New Connection Request",
          message: `${senderName} wants to connect with you on BuildersAfrica.`,
          type: "connection_request",
          related_project_id: null,
        },
      ]);

      setConnectionStatus("pending");
    }

    setIsConnecting(false);
  };

  const handleInvite = async () => {
    setIsInviting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("You must be logged in.");
      setIsInviting(false);
      return;
    }

    const { data: projects } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.id);

    if (!projects || projects.length === 0) {
      alert("You need to have a project before you can invite builders.");
      setIsInviting(false);
      return;
    }

    const project = projects[0];

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .single();

    const senderName = profile?.full_name || user.email || "Someone";

    await supabase.from("notifications").insert([
      {
        user_id: builder!.user_id,
        title: "Project Invitation",
        message: `${senderName} has invited you to join their project: ${project.title}`,
        type: "invite",
        related_project_id: project.id,
      },
    ]);

    setInviteDone(true);
    setIsInviting(false);
  };

  const connectLabel = () => {
    if (isConnecting) return "Connecting...";
    if (connectionStatus === "pending") return "Request Sent";
    if (connectionStatus === "accepted") return "Connected";
    if (connectionStatus === "declined") return "Declined";
    return "Connect";
  };

  const formatJoined = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  const isOpen = !!builder;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[480px] flex-col border-l border-border bg-surface shadow-2xl transition-all duration-300 ease-in-out ${
          isOpen
            ? "translate-x-0 opacity-100 visible"
            : "translate-x-full opacity-0 invisible pointer-events-none"
        }`}
      >
        {/* Close button */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <span className="text-sm font-medium text-muted">
            Builder Profile
          </span>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close builder profile"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          {builder && (
            <>
              {/* Profile header */}
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-surface-secondary">
                  {builder.avatar_url ? (
                    <img
                      src={builder.avatar_url}
                      alt={builder.full_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User size={36} className="text-muted" />
                  )}
                </div>

                <div className="space-y-0.5">
                  <h2 className="text-xl font-bold text-foreground">
                    {builder.full_name || "Unnamed Builder"}
                  </h2>

                  <p className="text-sm font-medium text-[#00AFEF]">
                    {builder.professional_title || "Builder"}
                  </p>

                  <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
                    <span>{countryToFlag(builder.country)}</span>
                    <span>{builder.country || "Location not set"}</span>
                  </p>
                </div>

                {builder.created_at && (
                  <div className="flex items-center gap-1.5 text-xs text-muted">
                    <CalendarDays size={12} />
                    <span>Joined {formatJoined(builder.created_at)}</span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={isConnecting || connectionStatus !== "none"}
                  className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                    connectionStatus === "accepted"
                      ? "cursor-default border border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                      : connectionStatus === "pending"
                      ? "cursor-default border border-border bg-surface-secondary text-muted"
                      : connectionStatus === "declined"
                      ? "cursor-default border border-red-500/20 bg-red-500/10 text-red-500"
                      : "bg-[#00AFEF] text-white hover:bg-[#009bd4] active:scale-[0.98]"
                  }`}
                >
                  {isConnecting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : connectionStatus === "accepted" ? (
                    <Check size={14} />
                  ) : (
                    <UserPlus size={14} />
                  )}
                  {connectLabel()}
                </button>

                <button
                  type="button"
                  onClick={handleInvite}
                  disabled={isInviting || inviteDone}
                  className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition-all ${
                    inviteDone
                      ? "cursor-default border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                      : "border-border bg-surface-secondary text-foreground hover:border-[#00AFEF]/40 hover:bg-[#00AFEF]/10 active:scale-[0.98]"
                  }`}
                >
                  {isInviting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : inviteDone ? (
                    <Check size={14} />
                  ) : (
                    <FolderPlus size={14} />
                  )}
                  {inviteDone ? "Invited!" : "Invite to Project"}
                </button>

                <button
                  type="button"
                  onClick={() => setMessageModalOpen(true)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-secondary py-2.5 text-sm font-semibold text-foreground transition-all hover:border-[#00AFEF]/40 hover:bg-[#00AFEF]/10 hover:text-[#00AFEF]"
                >
                  <MessageSquare size={14} />
                  Message
                </button>
              </div>

              {/* Bio */}
              {builder.bio && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold tracking-wider text-muted">
                    About me
                  </h4>

                  <div className="rounded-xl border border-border bg-surface-secondary p-4">
                    <p className="text-xs leading-relaxed text-foreground">
                      {builder.bio}
                    </p>
                  </div>
                </div>
              )}

              {/* Skills */}
              {builder.skills && builder.skills.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Skills
                  </h4>

                  <div className="rounded-xl border border-border bg-surface-secondary p-4">
                    <div className="flex flex-wrap gap-2">
                      {builder.skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-lg border border-border bg-surface px-3 py-1 text-xs font-medium text-[#00AFEF]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Links */}
              {(builder.github_url ||
                builder.linkedin_url ||
                builder.website_url) && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Links
                  </h4>

                  <div className="space-y-3 rounded-xl border border-border bg-surface-secondary p-4">
                    {builder.github_url && (
                      <a
                        href={builder.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-muted transition-colors hover:text-[#00AFEF]"
                      >
                        <Link2 size={14} className="shrink-0" />
                        <span className="truncate">{builder.github_url}</span>
                      </a>
                    )}

                    {builder.linkedin_url && (
                      <a
                        href={builder.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-muted transition-colors hover:text-[#00AFEF]"
                      >
                        <ExternalLink size={14} className="shrink-0" />
                        <span className="truncate">{builder.linkedin_url}</span>
                      </a>
                    )}

                    {builder.website_url && (
                      <a
                        href={builder.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-muted transition-colors hover:text-[#00AFEF]"
                      >
                        <Globe size={14} className="shrink-0" />
                        <span className="truncate">{builder.website_url}</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {builder && (
        <SendMessageModal
          recipientId={builder.user_id}
          recipientName={builder.full_name}
          recipientAvatar={builder.avatar_url}
          isOpen={messageModalOpen}
          onClose={() => setMessageModalOpen(false)}
        />
      )}
    </>
  );
}
