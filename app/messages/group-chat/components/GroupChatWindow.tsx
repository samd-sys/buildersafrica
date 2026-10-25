import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { GroupConversation, GroupMessage } from "../groupTypes";
import GroupMessageBubble from "./GroupMessageBubble";
import MessageInput, { ReplyTo } from "../../components/MessageInput";
import { TeamMemberOption } from "./MentionPicker";
import { Bell, BellOff, Loader2, Users } from "lucide-react";
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from "../../types";

type Props = {
  conversation: GroupConversation;
  currentUserId: string;
  onMuteToggle: (convId: string, muted: boolean) => void;
};

export default function GroupChatWindow({
  conversation: conv,
  currentUserId,
  onMuteToggle,
}: Props) {
  const [messages,       setMessages]       = useState<GroupMessage[]>([]);
  const [teamMembers,    setTeamMembers]    = useState<TeamMemberOption[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [togglingMute,   setTogglingMute]   = useState(false);
  const [replyTo,        setReplyTo]        = useState<ReplyTo | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () =>
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });

  // Load team members for @mention picker
  const loadTeamMembers = useCallback(async () => {
    const { data: members } = await supabase
      .from("team_members")
      .select("user_id")
      .eq("project_id", conv.project_id);

    if (!members || members.length === 0) return;

    const ids = members.map((m: any) => m.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url")
      .in("user_id", ids)
      .neq("user_id", currentUserId);

    setTeamMembers(
      (profiles || []).map((p: any) => ({
        user_id:    p.user_id,
        full_name:  p.full_name  || "Unknown",
        avatar_url: p.avatar_url || "",
      }))
    );
  }, [conv.project_id, currentUserId]);

  const loadMessages = useCallback(async () => {
    setLoading(true);

    const { data: msgs } = await supabase
      .from("messages")
      .select("id, conversation_id, sender_id, content, attachment_url, attachment_type, is_read, deleted_at, created_at, reply_to_id, reply_to_content, reply_to_sender")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: true });

    if (!msgs || msgs.length === 0) { setMessages([]); setLoading(false); return; }

    const senderIds = [...new Set(msgs.map((m: any) => m.sender_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url")
      .in("user_id", senderIds);

    const profileMap: Record<string, { full_name: string; avatar_url: string }> = {};
    profiles?.forEach((p: any) => { profileMap[p.user_id] = p; });

    const enriched: GroupMessage[] = msgs.map((m: any) => ({
      ...m,
      senderName:   profileMap[m.sender_id]?.full_name   || "Unknown",
      senderAvatar: profileMap[m.sender_id]?.avatar_url  || "",
    }));

    setMessages(enriched);
    setLoading(false);
  }, [conv.id]);

  // Mark all unread group messages as read when chat is open
  const markAsRead = useCallback(async () => {
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", conv.id)
      .eq("is_read", false)
      .neq("sender_id", currentUserId);

    setMessages((prev) =>
      prev.map((m) =>
        !m.is_read && m.sender_id !== currentUserId
          ? { ...m, is_read: true }
          : m
      )
    );
  }, [conv.id, currentUserId]);

  useEffect(() => {
    loadMessages();
    loadTeamMembers();
  }, [loadMessages, loadTeamMembers]);

  useEffect(() => {
    if (!loading) {
      scrollToBottom();
      markAsRead();
    }
  }, [loading]);
  useEffect(() => { scrollToBottom(); }, [messages.length]);

  // Real-time
  useEffect(() => {
    const channel = supabase
      .channel(`group-chat-${conv.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `conversation_id=eq.${conv.id}` },
        async (payload: any) => {
          if (payload.eventType === "INSERT") {
            const m = payload.new;
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, avatar_url")
              .eq("user_id", m.sender_id)
              .single();

            const enriched: GroupMessage = {
              ...m,
              senderName:   profile?.full_name   || "Unknown",
              senderAvatar: profile?.avatar_url  || "",
            };
            setMessages((prev) => {
              if (prev.find((x) => x.id === enriched.id)) return prev;
              return [...prev, enriched];
            });
            // Mark as read immediately since this chat is open
            if (m.sender_id !== currentUserId) {
              supabase
                .from("messages")
                .update({ is_read: true })
                .eq("id", m.id);
            }
          }
          if (payload.eventType === "UPDATE") {
            setMessages((prev) =>
              prev.map((x) => x.id === payload.new.id ? { ...x, ...payload.new } : x)
            );
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conv.id]);

  const handleSend = async (content: string, file?: File, reply?: ReplyTo) => {
    let attachmentUrl:  string | null = null;
    let attachmentType: string | null = null;

    if (file) {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) { alert("File type not supported."); return; }
      if (file.size > MAX_FILE_SIZE)               { alert("File too large. Max 10MB."); return; }

      const ext  = file.name.split(".").pop();
      const path = `group/${conv.id}/${currentUserId}-${Date.now()}.${ext}`;
      setUploadProgress(0);
      const { error: upErr } = await supabase.storage.from("messages").upload(path, file, { upsert: false });
      setUploadProgress(null);
      if (upErr) { alert("Upload failed: " + upErr.message); return; }
      const { data: { publicUrl } } = supabase.storage.from("messages").getPublicUrl(path);
      attachmentUrl  = publicUrl;
      attachmentType = file.type;
    }

    if (!content && !attachmentUrl) return;

    // Extract @mentions from content
    const mentionMatches = content.match(/@([\w\s]+?)(?=\s|$)/g) || [];
    const mentionedNames = mentionMatches.map((m) => m.slice(1).trim());

    await supabase.from("messages").insert([{
      conversation_id: conv.id,
      sender_id:       currentUserId,
      content:         content || null,
      attachment_url:  attachmentUrl,
      attachment_type: attachmentType,
      is_read:         false,
      reply_to_id:      reply?.id      || null,
      reply_to_content: reply?.content || null,
      reply_to_sender:  reply?.senderName || null,
    }]);

    setReplyTo(null);

    // Notify all team members except sender (skip muted)
    const { data: members } = await supabase
      .from("team_members")
      .select("user_id")
      .eq("project_id", conv.project_id)
      .neq("user_id", currentUserId);

    const { data: mutes } = await supabase
      .from("conversation_mutes")
      .select("user_id")
      .eq("conversation_id", conv.id);

    const mutedIds = new Set((mutes || []).map((m: any) => m.user_id));

    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", currentUserId)
      .single();

    const senderName = senderProfile?.full_name || "Someone";
    const preview    = content ? content.slice(0, 60) + (content.length > 60 ? "..." : "") : "📎 Sent an attachment";

    const toNotify = (members || [])
      .filter((m: any) => !mutedIds.has(m.user_id))
      .map((m: any) => ({
        user_id:            m.user_id,
        title:              conv.name,
        message:            `${senderName}: ${preview}`,
        type:               "team_message",
        sender_id:          currentUserId,
        related_project_id: conv.project_id,
      }));

    // Extra notification for @mentioned members (even if muted)
    if (mentionedNames.length > 0) {
      const { data: mentionedProfiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("full_name", mentionedNames)
        .neq("user_id", currentUserId);

      const mentionNotifs = (mentionedProfiles || []).map((p: any) => ({
        user_id:            p.user_id,
        title:              `${senderName} mentioned you`,
        message:            `In ${conv.name}: ${preview}`,
        type:               "mention",
        sender_id:          currentUserId,
        related_project_id: conv.project_id,
      }));

      if (mentionNotifs.length > 0) {
        await supabase.from("notifications").insert(mentionNotifs);
      }
    }

    if (toNotify.length > 0) {
      await supabase.from("notifications").insert(toNotify);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase
      .from("messages")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
  };

  const handleMuteToggle = async () => {
    setTogglingMute(true);
    if (conv.isMuted) {
      await supabase.from("conversation_mutes").delete()
        .eq("conversation_id", conv.id).eq("user_id", currentUserId);
      onMuteToggle(conv.id, false);
    } else {
      await supabase.from("conversation_mutes").insert([{ conversation_id: conv.id, user_id: currentUserId }]);
      onMuteToggle(conv.id, true);
    }
    setTogglingMute(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#09090B]">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[#1F1F23] bg-[#0C0C0E] px-5 py-4 shrink-0">
        <div className="h-9 w-9 rounded-xl border border-[#27272A] bg-[#18181B] overflow-hidden flex items-center justify-center shrink-0">
          {conv.projectLogo ? (
            <img src={conv.projectLogo} alt={conv.name} className="h-full w-full object-cover" />
          ) : (
            <Users size={16} className="text-gray-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{conv.name}</p>
          <p className="text-xs text-gray-500">Team Chat · {teamMembers.length + 1} members</p>
        </div>
        <button
          onClick={handleMuteToggle}
          disabled={togglingMute}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
            conv.isMuted
              ? "border-[#00AFEF]/20 bg-[#00AFEF]/5 text-[#00AFEF]"
              : "border-[#1F1F23] bg-[#121215] text-gray-400 hover:text-white"
          } disabled:opacity-60`}
        >
          {togglingMute ? (
            <Loader2 size={12} className="animate-spin" />
          ) : conv.isMuted ? (
            <Bell size={12} />
          ) : (
            <BellOff size={12} />
          )}
          {conv.isMuted ? "Unmute" : "Mute"}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={24} className="animate-spin text-[#00AFEF]" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <Users size={32} className="text-gray-700" />
            <div>
              <p className="text-sm font-semibold text-white">{conv.name}</p>
              <p className="text-xs text-gray-500 mt-1">No messages yet. Say hello to the team!</p>
            </div>
          </div>
        ) : (
          (() => {
            let lastDate = "", lastSender = "";
            return messages.map((m) => {
              const msgDate = new Date(m.created_at)
                .toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
              const showDate   = msgDate !== lastDate;
              const showSender = m.sender_id !== lastSender || showDate;
              lastDate   = msgDate;
              lastSender = m.sender_id;

              return (
                <div key={m.id}>
                  {showDate && (
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-[#1F1F23]" />
                      <span className="text-[10px] text-gray-600 shrink-0">{msgDate}</span>
                      <div className="flex-1 h-px bg-[#1F1F23]" />
                    </div>
                  )}
                  <GroupMessageBubble
                    message={m}
                    isMine={m.sender_id === currentUserId}
                    showSender={showSender && m.sender_id !== currentUserId}
                    onDelete={handleDelete}
                    onReply={(msg) => setReplyTo({
                      id:         msg.id,
                      senderName: msg.senderName,
                      content:    msg.content || (msg.attachment_url ? "📎 Attachment" : ""),
                    })}
                  />
                </div>
              );
            });
          })()
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <MessageInput
        onSend={handleSend}
        uploadProgress={uploadProgress}
        placeholder="Message the team... (type @ to mention)"
        teamMembers={teamMembers}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  );
}