
"use client";

import {
  useEffect,
  useState,
  useCallback,
  Suspense,
} from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { DMConversation, ConversationStatus } from "./types";
import ConversationList from "./components/ConversationList";
import ChatWindow from "./components/ChatWindow";
import GroupConversationList from "./group-chat/components/GroupConversationList";
import GroupChatWindow from "./group-chat/components/GroupChatWindow";
import ChatToggle, { ChatMode } from "./group-chat/components/ChatToggle";
import { GroupConversation } from "./group-chat/groupTypes";
import { ArrowLeft, MessageSquare } from "lucide-react";

function MessagesContent() {
  const searchParams = useSearchParams();
  const convParam = searchParams.get("conv");
  const groupParam = searchParams.get("group");

  const [mode, setMode] = useState<ChatMode>(
    groupParam ? "group" : "private"
  );

  const [conversations, setConversations] = useState<DMConversation[]>([]);
  const [groupConvs, setGroupConvs] = useState<GroupConversation[]>([]);
  const [activeConv, setActiveConv] = useState<DMConversation | null>(null);
  const [activeGroup, setActiveGroup] = useState<GroupConversation | null>(null);
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  // Mobile navigation: list view or active chat view.
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  // Track the sidebar hover state.
  useEffect(() => {
    const handleSidebarHover = (event: CustomEvent) => {
      setIsSidebarHovered(event.detail.isHovered);
    };

    window.addEventListener(
      "sidebarHover",
      handleSidebarHover as EventListener
    );

    return () => {
      window.removeEventListener(
        "sidebarHover",
        handleSidebarHover as EventListener
      );
    };
  }, []);

  // Load private conversations.
  const loadConversations = useCallback(
    async (userId: string) => {
      const { data: convs } = await supabase
        .from("dm_conversations")
        .select("*")
        .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (!convs || convs.length === 0) {
        setConversations([]);
        return;
      }

      const otherIds = convs.map((c: any) =>
        c.participant_1 === userId ? c.participant_2 : c.participant_1
      );

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, professional_title")
        .in("user_id", otherIds);

      const profileMap: Record<string, any> = {};

      profiles?.forEach((profile: any) => {
        profileMap[profile.user_id] = profile;
      });

      const enriched: DMConversation[] = await Promise.all(
        convs.map(async (c: any) => {
          const otherId =
            c.participant_1 === userId
              ? c.participant_2
              : c.participant_1;

          const profile = profileMap[otherId] ?? {};

          const { data: lastMsgs } = await supabase
            .from("dm_messages")
            .select(
              "content, file_name, created_at, sender_id, deleted_at"
            )
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
            id: c.id,
            participant_1: c.participant_1,
            participant_2: c.participant_2,
            status: c.status as ConversationStatus,
            requested_by: c.requested_by,
            created_at: c.created_at,
            otherUser: {
              user_id: otherId,
              full_name: profile.full_name || "Unknown",
              avatar_url: profile.avatar_url || "",
              professional_title: profile.professional_title || "",
            },
            lastMessage: lastMsgs?.[0] ?? undefined,
            unreadCount: count ?? 0,
          };
        })
      );

      setConversations(enriched);

      if (convParam) {
        const target = enriched.find((c) => c.id === convParam);

        if (target) {
          setActiveConv(target);
          setActiveGroup(null);
          setMode("private");
          setMobileChatOpen(true);
        }
      }
    },
    [convParam]
  );

  // Load group conversations.
  const loadGroupConversations = useCallback(
    async (userId: string) => {
      const { data: convs } = await supabase
        .from("conversations")
        .select("*")
        .eq("type", "team")
        .order("created_at", { ascending: false });

      if (!convs || convs.length === 0) {
        setGroupConvs([]);
        return;
      }

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
        ...(memberships || []).map((m: any) => m.project_id),
        ...(ownedProjects || []).map((p: any) => p.id),
      ]);

      const accessible = convs.filter((c: any) =>
        memberProjectIds.has(c.project_id)
      );

      if (accessible.length === 0) {
        setGroupConvs([]);
        return;
      }

      const projectIdsForChats = accessible.map((c: any) => c.project_id);

      const { data: projects } = await supabase
        .from("projects")
        .select("id, logo_url")
        .in("id", projectIdsForChats);

      const logoMap: Record<string, string> = {};

      projects?.forEach((project: any) => {
        logoMap[project.id] = project.logo_url || "";
      });

      const conversationIds = accessible.map((c: any) => c.id);

      const { data: mutes } = await supabase
        .from("conversation_mutes")
        .select("conversation_id")
        .eq("user_id", userId)
        .in("conversation_id", conversationIds);

      const mutedSet = new Set(
        (mutes || []).map((m: any) => m.conversation_id)
      );

      const enriched: GroupConversation[] = await Promise.all(
        accessible.map(async (c: any) => {
          const { data: lastMsgs } = await supabase
            .from("messages")
            .select(
              "content, attachment_url, sender_id, created_at, deleted_at"
            )
            .eq("conversation_id", c.id)
            .order("created_at", { ascending: false })
            .limit(1);

          let lastMessage: GroupConversation["lastMessage"] = undefined;

          if (lastMsgs?.[0]) {
            const last = lastMsgs[0];

            const { data: senderProfile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("user_id", last.sender_id)
              .single();

            lastMessage = {
              content: last.content,
              attachment_url: last.attachment_url,
              sender_name: senderProfile?.full_name || "Unknown",
              created_at: last.created_at,
              deleted_at: last.deleted_at,
            };
          }

          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", c.id)
            .eq("is_read", false)
            .neq("sender_id", userId);

          return {
            id: c.id,
            name: c.name,
            project_id: c.project_id,
            created_by: c.created_by,
            created_at: c.created_at,
            projectLogo: logoMap[c.project_id] || "",
            lastMessage,
            unreadCount: count ?? 0,
            isMuted: mutedSet.has(c.id),
          };
        })
      );

      setGroupConvs(enriched);

      if (groupParam) {
        const target = enriched.find((c) => c.id === groupParam);

        if (target) {
          setActiveGroup(target);
          setActiveConv(null);
          setMode("group");
          setMobileChatOpen(true);
        }
      }
    },
    [groupParam]
  );

  // Load both private and group conversations.
  const loadAll = useCallback(async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    setCurrentUserId(user.id);

    await Promise.all([
      loadConversations(user.id),
      loadGroupConversations(user.id),
    ]);

    setLoading(false);
  }, [loadConversations, loadGroupConversations]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Realtime updates for private conversations.
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel("dm-conversations-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "dm_conversations",
        },
        () => {
          loadConversations(currentUserId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, loadConversations]);

  // Realtime updates for group conversations.
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel("group-conversations-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
        },
        () => {
          loadGroupConversations(currentUserId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, loadGroupConversations]);

  // Update conversation status locally.
  const handleStatusChange = (
    id: string,
    status: ConversationStatus
  ) => {
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === id
          ? { ...conversation, status }
          : conversation
      )
    );

    setActiveConv((prev) =>
      prev?.id === id ? { ...prev, status } : prev
    );
  };

  // Update mute status locally.
  const handleMuteToggle = (convId: string, muted: boolean) => {
    setGroupConvs((prev) =>
      prev.map((conversation) =>
        conversation.id === convId
          ? { ...conversation, isMuted: muted }
          : conversation
      )
    );

    setActiveGroup((prev) =>
      prev?.id === convId
        ? { ...prev, isMuted: muted }
        : prev
    );
  };

  // Select a private conversation.
  const handleSelectPrivate = (conversation: DMConversation) => {
    setActiveConv(conversation);
    setActiveGroup(null);
    setMode("private");
    setMobileChatOpen(true);

    setConversations((prev) =>
      prev.map((item) =>
        item.id === conversation.id
          ? { ...item, unreadCount: 0 }
          : item
      )
    );
  };

  // Select a group conversation.
  const handleSelectGroup = (conversation: GroupConversation) => {
    setActiveGroup(conversation);
    setActiveConv(null);
    setMode("group");
    setMobileChatOpen(true);

    setGroupConvs((prev) =>
      prev.map((item) =>
        item.id === conversation.id
          ? { ...item, unreadCount: 0 }
          : item
      )
    );
  };

  // Return to the conversation list on mobile.
  const handleMobileBack = () => {
    setMobileChatOpen(false);
  };

  const dmUnread = conversations.reduce(
    (total, conversation) => total + conversation.unreadCount,
    0
  );

  const groupUnread = groupConvs.reduce(
    (total, conversation) =>
      total + (conversation.isMuted ? 0 : conversation.unreadCount),
    0
  );

  const noActiveChat =
    (mode === "private" && !activeConv) ||
    (mode === "group" && !activeGroup);

  const showConversationList = !mobileChatOpen;
  const showChatWindow = mobileChatOpen;

  return (
    <main
      className={`mt-3 flex h-[calc(100dvh-1.5rem)] min-h-[32rem] w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-border bg-background text-foreground sm:mt-4 sm:rounded-2xl md:mt-6 md:h-[calc(100dvh-1.5rem)] ${
        isSidebarHovered ? "md:ml-6" : "md:ml-14."
      }`}
      style={{
        transition: "margin 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* Left panel: conversation list */}
      <aside
        className={`${
          showConversationList ? "flex" : "hidden"
        } h-full w-full min-w-0 flex-col bg-sidebar md:flex md:w-72 md:shrink-0 lg:w-80`}
      >
        {/* Header and chat mode toggle */}
        <div className="shrink-0 space-y-3 border-b border-border px-3 py-3 sm:px-4 sm:py-4">
          <div className="flex items-center gap-2">
            <MessageSquare size={16} className="text-[#00AFEF]" />
            <h2 className="text-sm font-bold text-foreground">Messages</h2>
          </div>

          <ChatToggle
            mode={mode}
            onChange={(nextMode) => {
              setMode(nextMode);

              if (nextMode === "private") {
                setActiveGroup(null);
              } else {
                setActiveConv(null);
              }

              setMobileChatOpen(false);
            }}
            privateUnread={dmUnread}
            groupUnread={groupUnread}
          />
        </div>

        {/* Private or group conversation list */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {mode === "private" ? (
            <ConversationList
              conversations={conversations}
              activeId={activeConv?.id ?? null}
              currentUserId={currentUserId}
              onSelect={handleSelectPrivate}
            />
          ) : (
            <GroupConversationList
              conversations={groupConvs}
              activeId={activeGroup?.id ?? null}
              onSelect={handleSelectGroup}
            />
          )}
        </div>
      </aside>

      {/* Right panel: active chat */}
      <section
        className={`${
          showChatWindow ? "flex" : "hidden"
        } h-full min-h-0 min-w-0 flex-1 flex-col md:flex`}
      >
        {/* Mobile chat header with back navigation */}
        <div className="flex shrink-0 items-center gap-3 border-b border-border bg-surface px-3 py-3 md:hidden">
          <button
            type="button"
            onClick={handleMobileBack}
            aria-label="Back to conversations"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-secondary text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Messages</p>
            <p className="text-xs text-muted">
              {mode === "group"
                ? activeGroup?.name || "Team chat"
                : activeConv?.otherUser?.full_name || "Private conversation"}
            </p>
          </div>
        </div>

        <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
          {noActiveChat ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-5 text-center sm:px-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-surface">
                <MessageSquare size={28} className="text-muted" />
              </div>

              <div className="space-y-1">
                <p className="text-base font-semibold text-foreground sm:text-lg">
                  {loading
                    ? "Loading messages..."
                    : "Select a conversation"}
                </p>

                <p className="text-sm text-muted">
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
      </section>
    </main>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="mt-3 flex h-[calc(100dvh-1.5rem)] items-center justify-center rounded-xl border border-border bg-background sm:mt-4 md:mt-6">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-[#00AFEF]" />
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
