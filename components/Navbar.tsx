
"use client";

import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Bell,
  User,
  FolderOpen,
  PlusCircle,
  MessageSquare,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const pathname = usePathname();

  const [isHovered, setIsHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [dmUnreadCount, setDmUnreadCount] = useState(0);

  // Notify other components when the desktop sidebar expands or collapses
  useEffect(() => {
    const event = new CustomEvent("sidebarHover", {
      detail: { isHovered },
    });

    window.dispatchEvent(event);
  }, [isHovered]);

  // Close mobile menu when navigating to another page
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Avatar
  const loadAvatar = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setAvatarUrl("");
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("user_id", user.id)
      .single();

    if (error) {
      setAvatarUrl("");
      return;
    }

    setAvatarUrl(data?.avatar_url || "");
  };

  // Notification unread count
  const loadUnreadCount = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setUnreadCount(0);
      return;
    }

    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    setUnreadCount(count ?? 0);
  };

  // DM unread count
  const loadDmUnreadCount = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setDmUnreadCount(0);
      return;
    }

    const { data: convs } = await supabase
      .from("dm_conversations")
      .select("id")
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .eq("status", "accepted");

    if (!convs || convs.length === 0) {
      setDmUnreadCount(0);
      return;
    }

    const convIds = convs.map((conversation) => conversation.id);

    const { count } = await supabase
      .from("dm_messages")
      .select("*", { count: "exact", head: true })
      .in("conversation_id", convIds)
      .eq("is_read", false)
      .neq("sender_id", user.id);

    setDmUnreadCount(count ?? 0);
  };

  // Load user data and subscribe to updates
  useEffect(() => {
    let notifChannel: ReturnType<typeof supabase.channel> | null = null;
    let dmChannel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    const handleAvatarUpdated = (
      event: CustomEvent<{ avatarUrl: string }>
    ) => {
      setAvatarUrl(event.detail.avatarUrl || "");
    };

    window.addEventListener(
      "avatarUpdated",
      handleAvatarUpdated as EventListener
    );

    const setupSubscriptions = async () => {
      await Promise.all([
        loadAvatar(),
        loadUnreadCount(),
        loadDmUnreadCount(),
      ]);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || cancelled) return;

      const userId = user.id;

      // Notification badge updates
      notifChannel = supabase
        .channel("navbar-notifications")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
          },
          (payload) => {
            const row = (payload.new ?? payload.old ?? {}) as {
              user_id?: string;
            };

            if (row.user_id !== userId) return;

            loadUnreadCount();
          }
        )
        .subscribe();

      // Direct message badge updates
      dmChannel = supabase
        .channel("navbar-dm-messages")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "dm_messages",
          },
          () => {
            loadDmUnreadCount();
          }
        )
        .subscribe();
    };

    setupSubscriptions();

    return () => {
      cancelled = true;

      window.removeEventListener(
        "avatarUpdated",
        handleAvatarUpdated as EventListener
      );

      if (notifChannel) {
        supabase.removeChannel(notifChannel);
      }

      if (dmChannel) {
        supabase.removeChannel(dmChannel);
      }
    };
  }, []);

  // Hide navbar on landing, login, and signup pages
  const hideNavbarOn = ["/", "/login", "/signup"];

  if (hideNavbarOn.includes(pathname)) {
    return null;
  }

  // Main navigation items
  const navItems = [
    {
      name: "Projects",
      href: "/projects",
      icon: LayoutDashboard,
    },
    {
      name: "Builders",
      href: "/builders",
      icon: Users,
    },
    {
      name: "Notifications",
      href: "/notifications",
      icon: Bell,
    },
    {
      name: "Messages",
      href: "/messages",
      icon: MessageSquare,
    },
    {
      name: "Profile",
      href: "/profile",
      icon: User,
    },
  ];

  // Bottom navigation items
  const bottomItems = [
    {
      name: "My Projects",
      href: "/my-projects",
      icon: FolderOpen,
    },
    {
      name: "New Project",
      href: "/new-project",
      icon: PlusCircle,
    },
  ];

  const totalUnreadCount = dmUnreadCount + unreadCount;

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside
        className="group hidden md:fixed md:left-0 md:top-0 md:z-50 md:flex md:h-screen md:w-20 md:flex-col md:justify-between md:overflow-hidden md:border-r md:border-border md:bg-sidebar md:px-3 md:py-9 md:text-foreground md:transition-all md:duration-300 md:hover:w-64"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Top Section */}
        <div>
          {/* Logo */}
          <div className="mb-12 flex items-center gap-4 px-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#00AFEF]/10">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl">
                <img
                  src="/B8.png"
                  alt="BuildersAfrica Logo"
                  className="h-10 w-10 object-contain"
                />
              </div>
            </div>

            <div className="whitespace-nowrap opacity-0 transition-all duration-200 group-hover:opacity-100">
              <h1 className="text-xl font-bold">
                Builders
                <span className="text-[#00AFEF]">Africa</span>
              </h1>
            </div>
          </div>

          {/* Main Navigation */}
          <div className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;

              const isProfileItem = item.name === "Profile";
              const isNotifItem = item.name === "Notifications";
              const isMessagesItem = item.name === "Messages";
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative flex items-center gap-4 rounded-xl px-4 py-3 transition-all duration-200 ${
                    isActive
                      ? "bg-[#00AFEF]/10 text-[#00AFEF]"
                      : "text-muted hover:bg-surface-secondary hover:text-foreground"
                  }`}
                >
                  <div className="relative shrink-0">
                    {isProfileItem && avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Your profile"
                        className="h-8 w-8 min-w-8 rounded-full object-cover"
                      />
                    ) : (
                      <Icon size={22} className="min-w-[22px]" />
                    )}

                    {/* Notification unread badge */}
                    {isNotifItem && unreadCount > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#00AFEF] px-1 text-[9px] font-bold leading-none text-white">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}

                    {/* DM unread badge */}
                    {isMessagesItem && dmUnreadCount > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#00AFEF] px-1 text-[9px] font-bold leading-none text-white">
                        {dmUnreadCount > 99 ? "99+" : dmUnreadCount}
                      </span>
                    )}
                  </div>

                  <span className="ml-1 hidden whitespace-nowrap text-sm md:inline-block md:opacity-0 md:transition-opacity md:duration-200 md:group-hover:opacity-100">
                    {item.name}
                  </span>

                  {/* Expanded sidebar unread counts */}
                  {isMessagesItem && dmUnreadCount > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full border border-[#00AFEF]/30 bg-[#00AFEF]/10 px-1.5 text-[10px] font-bold text-[#00AFEF] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      {dmUnreadCount > 99 ? "99+" : dmUnreadCount}
                    </span>
                  )}

                  {isNotifItem && unreadCount > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full border border-[#00AFEF]/30 bg-[#00AFEF]/10 px-1.5 text-[10px] font-bold text-[#00AFEF] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="my-4 h-px w-full bg-border" />
        </div>

        {/* Bottom Section */}
        <div className="space-y-4">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-4 rounded-xl px-4 py-3 transition-all duration-200 ${
                  isActive
                    ? "bg-[#00AFEF]/10 text-[#00AFEF]"
                    : "text-muted hover:bg-surface-secondary hover:text-foreground"
                }`}
              >
                <Icon size={22} className="min-w-[22px] shrink-0" />

                <span className="ml-1 hidden whitespace-nowrap text-sm md:inline-block md:opacity-0 md:transition-opacity md:duration-200 md:group-hover:opacity-100">
                  {item.name}
                </span>
              </Link>
            );
          })}

          <div className="border-t border-border pt-3">
            <ThemeToggle showLabel={isHovered} />
          </div>
        </div>
      </aside>

      {/* MOBILE MENU BUTTON */}
      {!mobileOpen && (
        <button
          type="button"
          aria-label="Open navigation"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(true)}
          className="fixed bottom-6 right-6 z-[60] flex h-12 w-12 items-center justify-center rounded-full bg-[#00AFEF] text-black shadow-lg transition-transform hover:scale-105 active:scale-95 md:hidden"
        >
          <Menu size={22} />

          {totalUnreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
            </span>
          )}
        </button>
      )}

      {/* MOBILE SIDEBAR OVERLAY */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[70] flex md:hidden">
          {/* Background overlay */}
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />

          {/* Mobile sidebar */}
          <nav className="relative z-10 flex h-full w-[260px] max-w-[85vw] flex-col overflow-y-auto border-r border-border bg-sidebar p-4 text-foreground">
            {/* Mobile Header */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="/B8.png"
                  alt="BuildersAfrica Logo"
                  className="h-9 w-9 rounded-lg object-contain"
                />

                <h2 className="text-lg font-bold">
                  Builders
                  <span className="text-[#00AFEF]">Africa</span>
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
                className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-secondary hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>

            {/* Main Navigation */}
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;

                const isMessages = item.name === "Messages";
                const isNotif = item.name === "Notifications";
                const isProfile = item.name === "Profile";
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-3 transition-colors ${
                      isActive
                        ? "bg-[#00AFEF]/10 text-[#00AFEF]"
                        : "text-muted hover:bg-surface-secondary hover:text-foreground"
                    }`}
                  >
                    {isProfile && avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Your profile"
                        className="h-5 w-5 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <Icon size={20} className="shrink-0" />
                    )}

                    <span className="flex-1 text-sm">{item.name}</span>

                    {/* DM unread badge */}
                    {isMessages && dmUnreadCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#00AFEF] px-1.5 text-[10px] font-bold text-white">
                        {dmUnreadCount > 99 ? "99+" : dmUnreadCount}
                      </span>
                    )}

                    {/* Notification unread badge */}
                    {isNotif && unreadCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#00AFEF] px-1.5 text-[10px] font-bold text-white">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Divider */}
            <div className="my-5 h-px w-full bg-border" />

            {/* My Projects and New Project */}
            <div className="space-y-2">
              {bottomItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-3 transition-colors ${
                      isActive
                        ? "bg-[#00AFEF]/10 text-[#00AFEF]"
                        : "text-muted hover:bg-surface-secondary hover:text-foreground"
                    }`}
                  >
                    <Icon size={20} className="shrink-0" />

                    <span className="text-sm">{item.name}</span>
                  </Link>
                );
              })}

              {/* Mobile Theme Toggle */}
              <div className="mt-4 border-t border-border pt-3">
                <ThemeToggle showLabel />
              </div>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
