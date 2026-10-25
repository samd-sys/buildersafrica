"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Bell,
  User,
  FolderOpen,
  PlusCircle,
  MessageSquare,
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const pathname = usePathname();
  const [isHovered,      setIsHovered]      = useState(false);
  const [mobileOpen,     setMobileOpen]     = useState(false);
  const [avatarUrl,      setAvatarUrl]      = useState("");
  const [unreadCount,    setUnreadCount]    = useState(0);
  const [dmUnreadCount,  setDmUnreadCount]  = useState(0);

  useEffect(() => {
    const event = new CustomEvent("sidebarHover", { detail: { isHovered } });
    window.dispatchEvent(event);
  }, [isHovered]);

  // ── Avatar ────────────────────────────────────────────────────────────────
  const loadAvatar = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setAvatarUrl(""); return; }
    const { data, error } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("user_id", user.id)
      .single();
    if (error) { setAvatarUrl(""); return; }
    setAvatarUrl(data?.avatar_url || "");
  };

  // ── Notification unread count ─────────────────────────────────────────────
  const loadUnreadCount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUnreadCount(0); return; }
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    setUnreadCount(count ?? 0);
  };

  // ── DM unread count ───────────────────────────────────────────────────────
  const loadDmUnreadCount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setDmUnreadCount(0); return; }

    // Get all conversations the user is part of
    const { data: convs } = await supabase
      .from("dm_conversations")
      .select("id")
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .eq("status", "accepted");

    if (!convs || convs.length === 0) { setDmUnreadCount(0); return; }

    const convIds = convs.map((c: any) => c.id);

    const { count } = await supabase
      .from("dm_messages")
      .select("*", { count: "exact", head: true })
      .in("conversation_id", convIds)
      .eq("is_read", false)
      .neq("sender_id", user.id);

    setDmUnreadCount(count ?? 0);
  };

  useEffect(() => {
    loadAvatar();
    loadUnreadCount();
    loadDmUnreadCount();

    const handleAvatarUpdated = (event: CustomEvent<{ avatarUrl: string }>) => {
      setAvatarUrl(event.detail.avatarUrl || "");
    };
    window.addEventListener("avatarUpdated", handleAvatarUpdated as EventListener);

    let userId = "";
    supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => {
      const user = data.user;
      if (!user) return;
      userId = user.id;

      // Notification badge — all events so it clears when read
      const notifChannel = supabase
        .channel("navbar-notifications")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "notifications" },
          (payload: { new?: Record<string, unknown>; old?: Record<string, unknown> }) => {
            const row = payload.new ?? payload.old ?? {};
            if (row.user_id !== userId) return;
            loadUnreadCount();
          }
        )
        .subscribe();

      // DM badge — all events (* catches INSERT for new messages
      // AND UPDATE when is_read flips to true so badge clears immediately)
      const dmChannel = supabase
        .channel("navbar-dm-messages")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "dm_messages" },
          () => {
            // Re-fetch count on any change — handles both new messages
            // arriving and messages being marked as read
            loadDmUnreadCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(notifChannel);
        supabase.removeChannel(dmChannel);
      };
    });

    return () => {
      window.removeEventListener("avatarUpdated", handleAvatarUpdated as EventListener);
    };
  }, []);

  const hideNavbarOn = ["/", "/login", "/signup"];
  if (hideNavbarOn.includes(pathname)) return null;

  const navItems = [
    { name: "Projects",      href: "/projects",      icon: LayoutDashboard },
    { name: "Builders",      href: "/builders",       icon: Users           },
    { name: "Notifications", href: "/notifications",  icon: Bell            },
    { name: "Messages",      href: "/messages",       icon: MessageSquare   },
    { name: "Profile",       href: "/profile",        icon: User            },
  ];

  const bottomItems = [
    { name: "My Projects", href: "/my-projects", icon: FolderOpen  },
    { name: "New Project", href: "/new-project", icon: PlusCircle  },
  ];

  return (
    <>
      <aside
        className="hidden md:fixed md:left-0 md:top-0 md:z-50 md:flex md:h-screen md:w-23 md:flex-col md:justify-between md:overflow-hidden md:border-r md:border-white/10 md:bg-black/95 md:px-3 md:py-9 md:text-white md:transition-all md:duration-300 md:hover:w-64 group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Top Section */}
        <div>
          {/* Logo */}
          <div className="mb-12 flex items-center gap-4 px-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500 font-bold">
              <div className="flex h-10.2 w-13 items-center justify-center overflow-hidden rounded-xl">
                <img src="/B8.png" alt="BuildersAfrica Logo" className="h-14 w-14 object-cover" />
              </div>
            </div>
            <div className="opacity-6 transition-all duration-200 group-hover:opacity-100">
              <h1 className="text-xl font-bold">
                Builders<span className="text-cyan-400">Africa</span>
              </h1>
            </div>
          </div>

          {/* Main Navigation */}
          <div className="space-y-2">
            {navItems.map((item) => {
              const Icon        = item.icon;
              const isProfileItem = item.name === "Profile";
              const isNotifItem   = item.name === "Notifications";
              const isMessagesItem = item.name === "Messages";
              const isActive      = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative flex items-center gap-4 rounded-xl px-4 py-3 transition-all duration-200 ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-gray-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div className="relative shrink-0">
                    {isProfileItem && avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Your profile"
                        className="h-[32px] w-[32px] min-w-[32px] rounded-full object-cover"
                      />
                    ) : (
                      <Icon size={22} className="min-w-[22px]" />
                    )}

                    {/* Notification unread badge */}
                    {isNotifItem && unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#00AFEF] px-1 text-[9px] font-bold text-white leading-none">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}

                    {/* DM unread badge */}
                    {isMessagesItem && dmUnreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#00AFEF] px-1 text-[9px] font-bold text-white leading-none">
                        {dmUnreadCount > 99 ? "99+" : dmUnreadCount}
                      </span>
                    )}
                  </div>

                  <span className="ml-1 hidden md:inline-block md:opacity-0 md:transition-opacity md:duration-200 md:group-hover:opacity-100 whitespace-nowrap text-sm">
                    {item.name}
                  </span>

                  {/* Inline unread count when sidebar is expanded */}
                  {isMessagesItem && dmUnreadCount > 0 && (
                    <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#00AFEF]/20 border border-[#00AFEF]/30 px-1.5 text-[10px] font-bold text-[#00AFEF]">
                      {dmUnreadCount > 99 ? "99+" : dmUnreadCount}
                    </span>
                  )}
                  {isNotifItem && unreadCount > 0 && (
                    <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#00AFEF]/20 border border-[#00AFEF]/30 px-1.5 text-[10px] font-bold text-[#00AFEF]">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="my-4 h-px w-full bg-white/20" />
        </div>

        {/* Bottom Section */}
        <div className="space-y-35">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const isNewProject = item.name === "New Project";
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-4 rounded-xl px-4 py-3 text-gray-400 transition-all duration-200 hover:bg-white/10 hover:text-white ${
                  isNewProject ? "-translate-y-8.5" : ""
                }`}
              >
                <Icon size={22} className={`min-w-[22px] ${isNewProject ? "-translate-y-0.5" : ""}`} />
                <span className="ml-1 hidden md:inline-block md:opacity-0 md:transition-opacity md:duration-200 md:group-hover:opacity-100 whitespace-nowrap text-sm">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </aside>

      {/* Mobile nav trigger */}
      <div className="fixed bottom-6 right-6 z-50 md:hidden">
        <button
          aria-label="Open navigation"
          onClick={() => setMobileOpen((v) => !v)}
          className="relative rounded-full bg-[#00AFEF] p-3 text-black shadow-lg"
        >
          <Users size={20} />
          {/* Mobile total unread badge */}
          {(dmUnreadCount + unreadCount) > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
              {dmUnreadCount + unreadCount > 99 ? "99+" : dmUnreadCount + unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <nav className="relative z-50 w-full max-w-xs bg-[#0C0C0E] p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Menu</h2>
              <button onClick={() => setMobileOpen(false)} className="text-white/60">Close</button>
            </div>
            <div className="space-y-2">
              {navItems.map((item) => {
                const isMessages = item.name === "Messages";
                const isNotif    = item.name === "Notifications";
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-white/90 hover:bg-white/5"
                  >
                    <item.icon size={18} />
                    <span className="flex-1">{item.name}</span>
                    {isMessages && dmUnreadCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#00AFEF] px-1 text-[9px] font-bold text-white">
                        {dmUnreadCount > 99 ? "99+" : dmUnreadCount}
                      </span>
                    )}
                    {isNotif && unreadCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#00AFEF] px-1 text-[9px] font-bold text-white">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}