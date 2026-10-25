"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { DMConversation, ConversationStatus } from "./types";
import ConversationList from "./components/ConversationList";
import ChatWindow from "./components/ChatWindow";
import GroupConversationList from "./group-chat/components/GroupConversationList";
import GroupChatWindow from "./group-chat/components/GroupChatWindow";
import ChatToggle, { ChatMode } from "./group-chat/components/ChatToggle";
import { GroupConversation } from "./group-chat/groupTypes";
import { MessageSquare } from "lucide-react";

function MessagesContent() {  
  const searchParams = useSearchParams();
  const convParam    = searchParams.get("conv");
  const groupParam   = searchParams.get("group");

  const [mode,          setMode]          = useState<ChatMode>(groupParam ? "group" : "private");
  const [conversations, setConversations] = useState<DMConversation[]>([]);
  const [groupConvs,    setGroupConvs]    = useState<GroupConversation[]>([]);
  const [activeConv,    setActiveConv]    = useState<DMConversation | null>(null);
  const [activeGroup,   setActiveGroup]   = useState<GroupConversation | null>(null);
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading,       setLoading]       = useState(true);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  useEffect(() => {
    const handleSidebarHover = (event: CustomEvent) => {
      setIsSidebarHovered(event.detail.isHovered);
    };
    window.addEventListener("sidebarHover", handleSidebarHover as EventListener);
    return () =>
      window.removeEventListener("sidebarHover", handleSidebarHover as EventListener);
  }, []);

  // ── Load DM conversations ──────────────────────────────────────────────────
  const loadConversations = useCallback(async (userId: string) => {
    const { data: convs } = await supabase
      .from("dm_conversations")
      .select("*")
      .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (!convs || convs.length === 0) { setConversations([]); return; }

    const otherIds = convs.map((c: any) =>
      c.participant_1 === userId ? c.participant_2 : c.participant_1
    );

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url, professional_title")
      .in("user_id", otherIds);

    const profileMap: Record<string, any> = {};
    profiles?.forEach((p: any) => { profileMap[p.user_id] = p; });

    const enriched: DMConversation[] = await Promise.all(
      convs.map(async (c: any) => {
        const otherId = c.participant_1 === userId ? c.participant_2 : c.participant_1;
        const profile = profileMap[otherId] ?? {};

        const { data: lastMsgs } = await supabase
          .from("dm_messages")
          .select("content, file_name, created_at, sender_id, deleted_at")
          .eq("conversation_id", c.id)
          .order("created_at", { ascending: false })
          .limit(1);

        const { count } = await supabase
          .from("dm_messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", c.id)
          .eq("is_read", false)
          .neq("sender_id", userId);

        return {
          id:            c.id,
          participant_1: c.participant_1,
          participant_2: c.participant_2,
          status:        c.status as ConversationStatus,
          requested_by:  c.requested_by,
          created_at:    c.created_at,
          otherUser: {
            user_id:            otherId,
            full_name:          profile.full_name          || "Unknown",
            avatar_url:         profile.avatar_url         || "",
            professional_title: profile.professional_title || "",
          },
          lastMessage:  lastMsgs?.[0] ?? undefined,
          unreadCount:  count ?? 0,
        };
      })
    );

    setConversations(enriched);

    if (convParam) {
      const target = enriched.find((c) => c.id === convParam);
      if (target) { setActiveConv(target); setMode("private"); }
    }
  }, [convParam]);

  // ── Load group conversations ───────────────────────────────────────────────
  const loadGroupConversations = useCallback(async (userId: string) => {
    const { data: convs } = await supabase
      .from("conversations")
      .select("*")
      .eq("type", "team")
      .order("created_at", { ascending: false });

    if (!convs || convs.length === 0) { setGroupConvs([]); return; }

    const projectIds = convs.map((c: any) => c.project_id);

    const { data: memberships } = await supabase
      .from("team_members")
      .select("project_id")
      .eq("user_id", userId)
      .in("project_id", projectIds);

    const { data: ownedProjects } = await supabase
      .from("projects")
      .select("id")
      .eq("user_id", userId)
      .in("id", projectIds);

    const memberProjectIds = new Set([
      ...(memberships  || []).map((m: any) => m.project_id),
      ...(ownedProjects || []).map((p: any) => p.id),
    ]);

    const accessible = convs.filter((c: any) => memberProjectIds.has(c.project_id));
    if (accessible.length === 0) { setGroupConvs([]); return; }

    const pIds = accessible.map((c: any) => c.project_id);
    const { data: projects } = await supabase
      .from("projects")
      .select("id, logo_url")
      .in("id", pIds);

    const logoMap: Record<string, string> = {};
    projects?.forEach((p: any) => { logoMap[p.id] = p.logo_url || ""; });

    const convIds = accessible.map((c: any) => c.id);
    const { data: mutes } = await supabase
      .from("conversation_mutes")
      .select("conversation_id")
      .eq("user_id", userId)
      .in("conversation_id", convIds);

    const mutedSet = new Set((mutes || []).map((m: any) => m.conversation_id));

    const enriched: GroupConversation[] = await Promise.all(
      accessible.map(async (c: any) => {
        const { data: lastMsgs } = await supabase
          .from("messages")
          .select("content, attachment_url, sender_id, created_at, deleted_at")
          .eq("conversation_id", c.id)
          .order("created_at", { ascending: false })
          .limit(1);

        let lastMessage: GroupConversation["lastMessage"] = undefined;
        if (lastMsgs?.[0]) {
          const last = lastMsgs[0];
          const { data: sp } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", last.sender_id)
            .single();
          lastMessage = {
            content:        last.content,
            attachment_url: last.attachment_url,
            sender_name:    sp?.full_name || "Unknown",
            created_at:    last.created_at,
            deleted_at:     last.deleted_at,
          };
        }

        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", c.id)
          .eq("is_read", false)
          .neq("sender_id", userId);

        return {
          id:          c.id,
          name:        c.name,
          project_id:  c.project_id,
          created_by:  c.created_by,
          created_at:  c.created_at,
          projectLogo: logoMap[c.project_id] || "",
          lastMessage,
          unreadCount: count ?? 0,
          isMuted:     mutedSet.has(c.id),
        };
      })
    );

    setGroupConvs(enriched);

    if (groupParam) {
      const target = enriched.find((c) => c.id === groupParam);
      if (target) { setActiveGroup(target); setMode("group"); }
    }
  }, [groupParam]);

  // ── Initial load ───────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setCurrentUserId(user.id);
    await Promise.all([
      loadConversations(user.id),
      loadGroupConversations(user.id),
    ]);
    setLoading(false);
  }, [loadConversations, loadGroupConversations]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Real-time subscriptions ────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUserId) return;
    const channel = supabase
      .channel("dm-conversations-realtime")
      .on("postgres_changes",
        { event: "*", schema: "public", table: "dm_conversations" },
        () => { loadConversations(currentUserId); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentUserId, loadConversations]);

  useEffect(() => {
    if (!currentUserId) return;
    const channel = supabase
      .channel("group-conversations-realtime")
      .on("postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => { loadGroupConversations(currentUserId); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentUserId, loadGroupConversations]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleStatusChange = (id: string, status: ConversationStatus) => {
    setConversations((prev) => prev.map((c) => c.id === id ? { ...c, status } : c));
    setActiveConv((prev)    => prev?.id === id ? { ...prev, status } : prev);
  };

  const handleMuteToggle = (convId: string, muted: boolean) => {
    setGroupConvs((prev)  => prev.map((c) => c.id === convId ? { ...c, isMuted: muted } : c));
    setActiveGroup((prev) => prev?.id === convId ? { ...prev, isMuted: muted } : prev);
  };

  const dmUnread    = conversations.reduce((s, c) => s + c.unreadCount, 0);
  const groupUnread = groupConvs.reduce((s, c) => s + (c.isMuted ? 0 : c.unreadCount), 0);

  const noActiveChat =
    (mode === "private" && !activeConv) ||
    (mode === "group"   && !activeGroup);

  return (
    <div
      className={`h-160 mt-6 overflow-hidden rounded-2xl border border-white/20 bg-[#09090B] text-white flex transition-all duration-500 ease-in-out ${
        isSidebarHovered ? "ml-16" : "ml-0"
      }`}
      style={{
        transform:  isSidebarHovered ? "scale(1.005)" : "scale(1)",
        filter:     isSidebarHovered ? "brightness(0.98)" : "brightness(1)",
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* Left panel */}
      <div className="w-80 shrink-0 h-full flex flex-col border-r border-[#1F1F23] bg-[#0C0C0E]">
        {/* Header with toggle */}
        <div className="px-4 py-4 border-b border-[#1F1F23] space-y-3 shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare size={16} className="text-[#00AFEF]" />
            <h2 className="text-sm font-bold text-white">Messages</h2>
          </div>
          <ChatToggle
            mode={mode}
            onChange={(m) => {
              setMode(m);
              if (m === "private") setActiveGroup(null);
              else setActiveConv(null);
            }}
            privateUnread={dmUnread}
            groupUnread={groupUnread}
          />
        </div>

        {/* Conversation list */}
        {mode === "private" ? (
          <ConversationList
            conversations={conversations}
            activeId={activeConv?.id ?? null}
            currentUserId={currentUserId}
            onSelect={(conv) => {
              setActiveConv(conv);
              setConversations((prev) =>
                prev.map((c) => c.id === conv.id ? { ...c, unreadCount: 0 } : c)
              );
            }}
          />
        ) : (
          <GroupConversationList
            conversations={groupConvs}
            activeId={activeGroup?.id ?? null}
            onSelect={(conv) => {
              setActiveGroup(conv);
              setGroupConvs((prev) =>
                prev.map((c) => c.id === conv.id ? { ...c, unreadCount: 0 } : c)
              );
            }}
          />
        )}
      </div>

      {/* Right panel */}
      <div className="flex-1 h-full">
        {noActiveChat ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#1F1F23] bg-[#0F0F11]">
              <MessageSquare size={28} className="text-gray-700" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold text-white">
                {loading ? "Loading messages..." : "Select a conversation"}
              </p>
              <p className="text-sm text-gray-500">
                {loading
                  ? "Please wait..."
                  : mode === "group" && groupConvs.length === 0
                  ? "No team chats yet. Ask your project founder to create one."
                  : conversations.length === 0 && mode === "private"
                  ? "You have no messages yet. Visit a builder's profile to start a conversation."
                  : "Choose a conversation from the left to start chatting."}
              </p>
            </div>
          </div>
        ) : mode === "private" && activeConv ? (
          <ChatWindow
            key={activeConv.id}
            conversation={activeConv}
            currentUserId={currentUserId}
            onStatusChange={handleStatusChange}
          />
        ) : mode === "group" && activeGroup ? (
          <GroupChatWindow
            key={activeGroup.id}
            conversation={activeGroup}
            currentUserId={currentUserId}
            onMuteToggle={handleMuteToggle}
          />
        ) : null}
      </div>
    </div>
  );
}
export default function MessagesPage() {
  return (
    <Suspense fallback={null}>
      <MessagesContent />
    </Suspense>
  );
}