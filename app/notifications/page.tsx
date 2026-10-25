
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  Notification,
  NotificationTab,
  TABS,
  getTab,
} from "./types";
import NotificationCard from "./components/NotificationCard";
import NotificationTabs from "./components/NotificationTabs";
import RetentionSelector from "./components/RetentionSelector";
import { Bell, CheckCheck, Loader2 } from "lucide-react";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<NotificationTab>("projects");
  const [loading, setLoading] = useState(true);
  const [retentionDays, setRetentionDays] = useState(30);
  const [isSavingRetention, setIsSavingRetention] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

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

  // Load notifications and apply the configured retention period.
  const loadNotifications = useCallback(async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("notification_retention_days")
      .eq("user_id", user.id)
      .single();

    const savedRetention = profile?.notification_retention_days ?? 30;

    setRetentionDays(savedRetention);

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - savedRetention);

    await supabase
      .from("notifications")
      .delete()
      .eq("user_id", user.id)
      .in("type", [
        "like",
        "follow",
        "mention",
        "comment",
        "achievement",
        "trending",
      ])
      .lt("created_at", cutoff.toISOString());

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setNotifications(data || []);
    setLoading(false);
  }, []);

  // Initial load and realtime notification subscription.
  useEffect(() => {
    loadNotifications();

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        async (payload: { new: Record<string, unknown> }) => {
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (!user || payload.new.user_id !== user.id) return;

          setNotifications((prev) => [
            payload.new as Notification,
            ...prev,
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadNotifications]);

  // Group notifications by tab.
  const byTab = useMemo(() => {
    const result: Record<NotificationTab, Notification[]> = {
      projects: [],
      teams: [],
      applications: [],
      activity: [],
    };

    notifications.forEach((notification) => {
      result[getTab(notification.type)].push(notification);
    });

    return result;
  }, [notifications]);

  // Calculate unread counts for each tab.
  const unreadCounts = useMemo(() => {
    const counts: Record<NotificationTab, number> = {
      projects: 0,
      teams: 0,
      applications: 0,
      activity: 0,
    };

    notifications.forEach((notification) => {
      if (!notification.is_read) {
        counts[getTab(notification.type)]++;
      }
    });

    return counts;
  }, [notifications]);

  const totalUnread = Object.values(unreadCounts).reduce(
    (total, count) => total + count,
    0
  );

  // Mark a notification as read.
  const markRead = async (id: string) => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? { ...notification, is_read: true }
          : notification
      )
    );
  };

  // Mark all notifications in the active tab as read.
  const handleMarkAllRead = async () => {
    const ids = byTab[activeTab]
      .filter((notification) => !notification.is_read)
      .map((notification) => notification.id);

    if (ids.length === 0) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", ids);

    setNotifications((prev) =>
      prev.map((notification) =>
        ids.includes(notification.id)
          ? { ...notification, is_read: true }
          : notification
      )
    );
  };

  // Delete a notification.
  const handleDelete = async (id: string) => {
    await supabase
      .from("notifications")
      .delete()
      .eq("id", id);

    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  };

  // Accept a project invite.
  const handleAcceptInvite = async (
    id: string,
    projectId: string
  ) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase.from("applications").insert([
      {
        idea_id: projectId,
        applicant_id: user.id,
        message: "Accepted via invite",
        status: "accepted",
      },
    ]);

    await markRead(id);
  };

  // Reject a project invite.
  const handleRejectInvite = async (id: string) => {
    await markRead(id);
  };

  // Accept a builder's application to collaborate on a project.
  const handleAcceptApplication = async (
    id: string,
    senderId: string,
    projectId: string
  ) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // 1. Add builder to team_members.
    await supabase.from("team_members").insert([
      {
        project_id: projectId,
        user_id: senderId,
        role: "Collaborator",
      },
    ]);

    // 2. Update applications table.
    await supabase.from("applications").upsert([
      {
        idea_id: projectId,
        applicant_id: senderId,
        message: "Applied to collaborate",
        status: "accepted",
      },
    ]);

    // 3. Fetch project name.
    const { data: project } = await supabase
      .from("projects")
      .select("title")
      .eq("id", projectId)
      .single();

    // 4. Fetch founder's name.
    const { data: founderProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .single();

    const founderName =
      founderProfile?.full_name || "The project founder";

    const projectTitle = project?.title || "the project";

    // 5. Notify the applicant.
    await supabase.from("notifications").insert([
      {
        user_id: senderId,
        title: "Application Accepted! 🎉",
        message: `${founderName} accepted your application to collaborate on ${projectTitle}. Welcome to the team!`,
        type: "application_accepted",
        related_project_id: projectId,
        sender_id: user.id,
      },
    ]);

    // 6. Mark the original notification as read.
    await markRead(id);
  };

  // Reject a builder's application.
  const handleRejectApplication = async (
    id: string,
    senderId: string,
    projectId: string
  ) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // 1. Update applications table.
    await supabase.from("applications").upsert([
      {
        idea_id: projectId,
        applicant_id: senderId,
        message: "Applied to collaborate",
        status: "rejected",
      },
    ]);

    // 2. Fetch project and founder details.
    const { data: project } = await supabase
      .from("projects")
      .select("title")
      .eq("id", projectId)
      .single();

    const { data: founderProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .single();

    const founderName =
      founderProfile?.full_name || "The project founder";

    const projectTitle = project?.title || "the project";

    // 3. Notify the applicant.
    await supabase.from("notifications").insert([
      {
        user_id: senderId,
        title: "Application Update",
        message: `${founderName} reviewed your application for ${projectTitle} and decided not to move forward at this time.`,
        type: "application_rejected",
        related_project_id: projectId,
        sender_id: user.id,
      },
    ]);

    // 4. Mark the original notification as read.
    await markRead(id);
  };

  // Save notification retention settings.
  const handleRetentionChange = async (days: number) => {
    setRetentionDays(days);
    setIsSavingRetention(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from("profiles")
        .update({ notification_retention_days: days })
        .eq("user_id", user.id);
    }

    setIsSavingRetention(false);
  };

  const currentList = byTab[activeTab];
  const currentUnread = unreadCounts[activeTab];

  return (
    <main
      className={`mt-3 min-h-[calc(100dvh-1.5rem)] w-full min-w-0 max-w-full rounded-xl border border-white/20 bg-[#09090B] text-white sm:mt-4 sm:rounded-2xl md:mt-6 md:h-[calc(100dvh-1.5rem)] md:overflow-hidden ${
        isSidebarHovered ? "md:ml-1" : "md:-ml-14"
      }`}
      style={{
        transition: "margin 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <div className="mx-auto w-full max-w-3xl space-y-4 px-3 py-4 sm:px-5 sm:py-6 md:space-y-6 md:px-6 md:py-8">
        {/* Header card */}
        <div className="rounded-xl border border-[#1F1F23] bg-[#0F0F11] px-4 py-4 sm:rounded-2xl sm:px-6 sm:py-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#1F1F23] bg-[#121215]">
                <Bell size={18} className="text-[#00AFEF]" />
              </div>

              <div className="min-w-0">
                <h1 className="text-lg font-bold text-white sm:text-xl">
                  Notifications
                </h1>

                <p className="text-xs text-gray-500">
                  {totalUnread > 0
                    ? `${totalUnread} unread notification${
                        totalUnread !== 1 ? "s" : ""
                      }`
                    : "You're all caught up"}
                </p>
              </div>
            </div>

            {totalUnread > 0 && (
              <div className="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-full border border-purple-500/30 bg-purple-500/20 px-2.5 text-sm font-bold text-purple-400">
                {totalUnread > 99 ? "99+" : totalUnread}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <NotificationTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          unreadCounts={unreadCounts}
        />

        {/* Tab toolbar */}
        <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span>
              {currentList.length} notification
              {currentList.length !== 1 ? "s" : ""}
            </span>

            {currentUnread > 0 && (
              <span className="text-[#00AFEF]">
                · {currentUnread} unread
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end sm:gap-3">
            {activeTab === "activity" && (
              <RetentionSelector
                value={retentionDays}
                onChange={handleRetentionChange}
                isSaving={isSavingRetention}
              />
            )}

            {currentUnread > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1.5 rounded-lg border border-[#1F1F23] bg-[#121215] px-3 py-2 text-xs font-medium text-gray-400 transition-colors hover:border-white/10 hover:text-white"
              >
                <CheckCheck size={13} />
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Notification list */}
        {loading ? (
          <div className="flex items-center justify-center py-16 sm:py-20">
            <Loader2
              size={24}
              className="animate-spin text-purple-500"
            />
          </div>
        ) : currentList.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center sm:py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#1F1F23] bg-[#0F0F11] text-3xl">
              {TABS.find((tab) => tab.key === activeTab)?.emoji}
            </div>

            <div className="space-y-1 px-2">
              <p className="text-sm font-semibold text-white">
                No {activeTab} notifications
              </p>

              <p className="text-xs text-gray-500">
                {activeTab === "activity"
                  ? "Activity from likes, follows, and mentions will appear here."
                  : `Notifications related to your ${activeTab} will appear here.`}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {currentList.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onRead={markRead}
                onDelete={handleDelete}
                onAcceptInvite={handleAcceptInvite}
                onRejectInvite={handleRejectInvite}
                onAcceptApplication={handleAcceptApplication}
                onRejectApplication={handleRejectApplication}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
