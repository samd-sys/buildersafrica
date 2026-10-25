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
      // Fetch the sender's name so the notification is personal
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

    // Fetch the inviter's name so the notification is personal
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
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[480px] flex-col border-l border-[#1F1F23] bg-[#0C0C0E] shadow-2xl transition-all duration-300 ease-in-out ${
          isOpen
            ? "translate-x-0 opacity-100 visible"
            : "translate-x-full opacity-0 invisible pointer-events-none"
        }`}
      >
        {/* Close button */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#1F1F23] px-6 py-4">
          <span className="text-sm font-medium text-gray-400">
            Builder Profile
          </span>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {builder && (
            <>
              {/* Profile header */}
              <div className="flex flex-col items-center text-center gap-3">
                <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-[#27272A] bg-[#18181B] flex items-center justify-center">
                  {builder.avatar_url ? (
                    <img
                      src={builder.avatar_url}
                      alt={builder.full_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User size={36} className="text-gray-600" />
                  )}
                </div>

                <div className="space-y-0.5">
                  <h2 className="text-xl font-bold text-white">
                    {builder.full_name || "Unnamed Builder"}
                  </h2>
                  <p className="text-sm font-medium text-[#00AFEF]">
                    {builder.professional_title || "Builder"}
                  </p>
                  <p className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
                    <span>{countryToFlag(builder.country)}</span>
                    <span>{builder.country || "Location not set"}</span>
                  </p>
                </div>

                {builder.created_at && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <CalendarDays size={12} />
                    <span>Joined {formatJoined(builder.created_at)}</span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <button
                  onClick={handleConnect}
                  disabled={isConnecting || connectionStatus !== "none"}
                  className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                    connectionStatus === "accepted"
                      ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 cursor-default"
                      : connectionStatus === "pending"
                      ? "bg-white/5 border border-white/10 text-gray-400 cursor-default"
                      : connectionStatus === "declined"
                      ? "bg-red-500/10 border border-red-500/20 text-red-400 cursor-default"
                      : "bg-[#00AFEF] text-white hover:bg-[#00AFEF] active:scale-[0.98]"
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
                  onClick={handleInvite}
                  disabled={isInviting || inviteDone}
                  className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition-all ${
                    inviteDone
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 cursor-default"
                      : "border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.07] active:scale-[0.98]"
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
                  onClick={() => setMessageModalOpen(true)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-[#1F1F23] bg-white/[0.03] py-2.5 text-sm font-semibold text-white hover:bg-white/[0.07] transition-all"
                >
                  <MessageSquare size={14} />
                  Message
                </button>
              </div>

              {/* Bio */}
              {builder.bio && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold tracking-wider text-gray-500">
                    About me
                  </h4>
                  <div className="rounded-xl border border-[#1F1F23] bg-[#121215] p-4">
                    <p className="text-xs leading-relaxed text-gray-300">
                      {builder.bio}
                    </p>
                  </div>
                </div>
              )}

              {/* Skills */}
              {builder.skills && builder.skills.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Skills
                  </h4>
                  <div className="rounded-xl border border-white/10 bg-[#121215] p-4">
                    <div className="flex flex-wrap gap-2">
                      {builder.skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-lg border border-white/10 bg-gray px-3 py-1 text-xs font-medium text-[#00AFEF]"
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
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Links
                  </h4>
                  <div className="rounded-xl border border-[#1F1F23] bg-[#121215] p-4 space-y-3">
                    {builder.github_url && (
                      <a
                        href={builder.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors"
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
                        className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors"
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
                        className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors"
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