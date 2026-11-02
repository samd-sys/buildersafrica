
"use client";

import { useEffect, useState, useRef } from "react";
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
  ZoomIn,
  ZoomOut,
  RotateCcw,
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

  // Profile picture viewer
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const dragStart = useRef({ x: 0, y: 0 });
  const imagePositionStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!builder) return;

    setInviteDone(false);
    loadConnectionStatus();
  }, [builder?.user_id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (imageViewerOpen) {
          closeImageViewer();
        } else {
          onClose();
        }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, imageViewerOpen]);

  // Prevent background scrolling while the image viewer is open
  useEffect(() => {
    if (!imageViewerOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [imageViewerOpen]);

  const closeImageViewer = () => {
    setImageViewerOpen(false);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);
  };

  const openImageViewer = () => {
    if (!builder?.avatar_url) return;

    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setImageViewerOpen(true);
  };

  const changeZoom = (amount: number) => {
    setZoom((current) => {
      const next = Math.min(4, Math.max(1, current + amount));

      if (next === 1) {
        setPosition({ x: 0, y: 0 });
      }

      return next;
    });
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();

    setZoom((current) => {
      const next = Math.min(
        4,
        Math.max(1, current + (e.deltaY < 0 ? 0.2 : -0.2))
      );

      if (next === 1) {
        setPosition({ x: 0, y: 0 });
      }

      return next;
    });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLImageElement>) => {
    if (zoom <= 1) return;

    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);

    dragStart.current = { x: e.clientX, y: e.clientY };
    imagePositionStart.current = position;
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLImageElement>) => {
    if (!isDragging) return;

    setPosition({
      x: imagePositionStart.current.x + e.clientX - dragStart.current.x,
      y: imagePositionStart.current.y + e.clientY - dragStart.current.y,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

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

                {/* Clickable profile picture */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={openImageViewer}
                    disabled={!builder.avatar_url}
                    aria-label={`View ${builder.full_name}'s profile picture`}
                    className="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-surface-secondary transition-all hover:border-[#00AFEF] disabled:cursor-default"
                  >
                    {builder.avatar_url ? (
                      <>
                        <img
                          src={builder.avatar_url}
                          alt={builder.full_name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition-all group-hover:bg-black/35 group-hover:opacity-100">
                          <ZoomIn size={24} />
                        </span>
                      </>
                    ) : (
                      <User size={36} className="text-muted" />
                    )}
                  </button>

                  {builder.avatar_url && (
                    <span className="mt-1 block text-[10px] text-muted">
                      Click to enlarge
                    </span>
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

      {/* Profile picture zoom viewer */}
      {imageViewerOpen && builder?.avatar_url && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={closeImageViewer}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={closeImageViewer}
            aria-label="Close image viewer"
            className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white transition-colors hover:bg-white/20"
          >
            <X size={22} />
          </button>

          {/* Image controls */}
          <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/20 bg-black/70 p-2 shadow-xl">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                changeZoom(-0.25);
              }}
              disabled={zoom <= 1}
              aria-label="Zoom out"
              className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/20 disabled:opacity-40"
            >
              <ZoomOut size={19} />
            </button>

            <span className="min-w-12 text-center text-xs font-medium text-white">
              {Math.round(zoom * 100)}%
            </span>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                changeZoom(0.25);
              }}
              disabled={zoom >= 4}
              aria-label="Zoom in"
              className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/20 disabled:opacity-40"
            >
              <ZoomIn size={19} />
            </button>

            <div className="mx-1 h-6 w-px bg-white/20" />

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setZoom(1);
                setPosition({ x: 0, y: 0 });
              }}
              aria-label="Reset zoom"
              className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/20"
            >
              <RotateCcw size={17} />
            </button>
          </div>

          {/* Image display */}
          <div
            className="flex h-full w-full items-center justify-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onWheel={handleWheel}
          >
            <img
              src={builder.avatar_url}
              alt={`${builder.full_name}'s profile picture`}
              draggable={false}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className={`max-h-[85vh] max-w-[90vw] select-none rounded-lg object-contain shadow-2xl ${
                isDragging ? "cursor-grabbing" : zoom > 1 ? "cursor-grab" : "cursor-zoom-in"
              }`}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                transition: isDragging ? "none" : "transform 0.2s ease",
                touchAction: "none",
              }}
            />
          </div>

          <p className="absolute bottom-20 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-white/60">
            Scroll to zoom · Drag to move · Esc to close
          </p>
        </div>
      )}

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
