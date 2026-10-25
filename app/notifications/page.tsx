"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  Notification,
  NotificationTab,
  TABS,
  getTab,
  RETENTION_OPTIONS,
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

  useEffect(() => {
    const handleSidebarHover = (event: CustomEvent) => {
      setIsSidebarHovered(event.detail.isHovered);
    };
    window.addEventListener("sidebarHover", handleSidebarHover as EventListener);
    return () =>
      window.removeEventListener("sidebarHover", handleSidebarHover as EventListener);
  }, []);

  const loadNotifications = useCallback(async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

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
      .in("type", ["like", "follow", "mention", "comment", "achievement", "trending"])
      .lt("created_at", cutoff.toISOString());

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setNotifications(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadNotifications();

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        async (payload: { new: Record<string, unknown> }) => {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user || payload.new.user_id !== user.id) return;
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadNotifications]);

  const byTab = useMemo(() => {
    const result: Record<NotificationTab, Notification[]> = {
      projects: [], teams: [], applications: [], activity: [],
    };
    notifications.forEach((n) => { result[getTab(n.type)].push(n); });
    return result;
  }, [notifications]);

  const unreadCounts = useMemo(() => {
    const counts: Record<NotificationTab, number> = {
      projects: 0, teams: 0, applications: 0, activity: 0,
    };
    notifications.forEach((n) => {
      if (!n.is_read) counts[getTab(n.type)]++;
    });
    return counts;
  }, [notifications]);

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const handleMarkAllRead = async () => {
    const ids = byTab[activeTab].filter((n) => !n.is_read).map((n) => n.id);
    if (ids.length === 0) return;
    await supabase.from("notifications").update({ is_read: true }).in("id", ids);
    setNotifications((prev) =>
      prev.map((n) => (ids.includes(n.id) ? { ...n, is_read: true } : n))
    );
  };

  const handleDelete = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleAcceptInvite = async (id: string, projectId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("applications").insert([{
      idea_id: projectId,
      applicant_id: user.id,
      message: "Accepted via invite",
      status: "accepted",
    }]);

    await markRead(id);
  };

  const handleRejectInvite = async (id: string) => {
    await markRead(id);
  };

  // Accept a builder's application to collaborate on a project
  const handleAcceptApplication = async (
    id: string,
    senderId: string,
    projectId: string
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Add builder to team_members
    await supabase.from("team_members").insert([{
      project_id: projectId,
      user_id: senderId,
      role: "Collaborator",
    }]);

    // 2. Update applications table
    await supabase.from("applications").upsert([{
      idea_id: projectId,
      applicant_id: senderId,
      message: "Applied to collaborate",
      status: "accepted",
    }]);

    // 3. Fetch project name for the notification message
    const { data: project } = await supabase
      .from("projects")
      .select("title")
      .eq("id", projectId)
      .single();

    // 4. Fetch founder's name
    const { data: founderProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .single();

    const founderName = founderProfile?.full_name || "The project founder";
    const projectTitle = project?.title || "the project";

    // 5. Notify the applicant their application was accepted
    await supabase.from("notifications").insert([{
      user_id: senderId,
      title: "Application Accepted! 🎉",
      message: `${founderName} accepted your application to collaborate on ${projectTitle}. Welcome to the team!`,
      type: "application_accepted",
      related_project_id: projectId,
      sender_id: user.id,
    }]);

    // 6. Mark the original application notification as read
    await markRead(id);
  };

  // Reject a builder's application
  const handleRejectApplication = async (
    id: string,
    senderId: string,
    projectId: string
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Update applications table
    await supabase.from("applications").upsert([{
      idea_id: projectId,
      applicant_id: senderId,
      message: "Applied to collaborate",
      status: "rejected",
    }]);

    // 2. Fetch project name and founder name for the notification
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

    const founderName = founderProfile?.full_name || "The project founder";
    const projectTitle = project?.title || "the project";

    // 3. Notify the applicant their application was not accepted
    await supabase.from("notifications").insert([{
      user_id: senderId,
      title: "Application Update",
      message: `${founderName} reviewed your application for ${projectTitle} and decided not to move forward at this time.`,
      type: "application_rejected",
      related_project_id: projectId,
      sender_id: user.id,
    }]);

    // 4. Mark the original notification as read
    await markRead(id);
  };

  const handleRetentionChange = async (days: number) => {
    setRetentionDays(days);
    setIsSavingRetention(true);
    const { data: { user } } = await supabase.auth.getUser();
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
    <div
      className={`px-4 mt-6 -ml-10 min-h-149 w-280 rounded-2xl border border-white/20 bg-[#09090B]text-white transition-all duration-500 ease-in-out ${
        isSidebarHovered ? "ml-16" : "ml-0"
      }`}
      style={{
        transform: isSidebarHovered ? "scale(1.005)" : "scale(1)",
        filter: isSidebarHovered ? "brightness(0.98)" : "brightness(1)",
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">

        {/* Header card */}
        <div className="rounded-2xl border border-[#1F1F23] bg-[#0F0F11] px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#1F1F23] bg-[#121215]">
                <Bell size={18} className="text-[#00AFEF]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Notifications</h1>
                <p className="text-xs text-gray-500">
                  {totalUnread > 0
                    ? `${totalUnread} unread notification${totalUnread !== 1 ? "s" : ""}`
                    : "You're all caught up"}
                </p>
              </div>
            </div>
            {totalUnread > 0 && (
              <div className="flex h-8 min-w-8 items-center justify-center rounded-full bg-purple-500/20 border border-purple-500/30 px-2.5 text-sm font-bold text-purple-400">
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
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{currentList.length} notification{currentList.length !== 1 ? "s" : ""}</span>
            {currentUnread > 0 && (
              <span className="text-[#00AFEF]">· {currentUnread} unread</span>
            )}
          </div>
          <div className="flex items-center gap-3">
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
                className="flex items-center gap-1.5 rounded-lg border border-[#1F1F23] bg-[#121215] px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white hover:border-white/10 transition-colors"
              >
                <CheckCheck size={13} />
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Notification list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-purple-500" />
          </div>
        ) : currentList.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#1F1F23] bg-[#0F0F11] text-3xl">
              {TABS.find((t) => t.key === activeTab)?.emoji}
            </div>
            <div className="space-y-1">
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
            {currentList.map((n) => (
              <NotificationCard
                key={n.id}
                notification={n}
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
    </div>
  );
}