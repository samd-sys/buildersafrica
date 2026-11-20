
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Activity,
  MessageSquare,
  ArrowLeft,
  ListChecks,
  Milestone,
  Newspaper,
  CalendarCheck,
  ChevronDown,
} from "lucide-react";

type TeamWorkspaceSidebarProps = {
  projectId: string;
  activePage?: string;
};

export default function TeamWorkspaceSidebar({
  projectId,
  activePage = "overview",
}: TeamWorkspaceSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const projectItems = [
    {
      label: "Overview",
      icon: LayoutDashboard,
      href: `/team/${projectId}`,
      key: "overview",
    },
    {
      label: "Team Members",
      icon: Users,
      href: `/team/${projectId}#team-members`,
      key: "members",
    },
    {
      label: "Team Activity",
      icon: Activity,
      href: `/team/${projectId}/activity`,
      key: "activity",
    },
    {
      label: "Messages",
      icon: MessageSquare,
      href: "/messages",
      key: "messages",
    },
  ];

  const managementItems = [
    {
      label: "Task Management",
      icon: ListChecks,
      key: "tasks",
      href: `/team/${projectId}/tasks`,
    },
{
  label: "Project Roadmap",
  icon: Milestone,
  key: "roadmap",
  href: `/team/${projectId}/roadmap`,
},
    {
  label: "Team Availability",
  icon: CalendarCheck,
  key: "availability",
  href: `/team/${projectId}/availability`,
},
  ];

  const activeLabel =
    [...projectItems, ...managementItems].find(
      (item) => item.key === activePage
    )?.label || "Overview";

  const navigationContent = (
    <>
      <div className="mb-5">
        <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
          Project workspace
        </p>
      </div>

      <nav className="space-y-1">
        {projectItems.map((item) => {
          const Icon = item.icon;
          const active = activePage === item.key;

          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all ${
                active
                  ? "bg-[#00AFEF]/10 text-[#00AFEF]"
                  : "text-muted hover:bg-surface-secondary hover:text-foreground"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="my-5 border-t border-border" />

      <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
        Project Management
      </p>

      <nav className="space-y-1">
        {managementItems.map((item) => {
          const Icon = item.icon;
          const active = activePage === item.key;

          if (item.href) {
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all ${
                  active
                    ? "bg-[#00AFEF]/10 text-[#00AFEF]"
                    : "text-muted hover:bg-surface-secondary hover:text-foreground"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          }

          return (
            <button
              key={item.key}
              type="button"
              disabled
              title="Coming soon"
              className="flex w-full cursor-not-allowed items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-muted/60 opacity-70"
            >
              <Icon size={18} />
              <span className="flex-1">{item.label}</span>
              <span className="text-[9px] font-semibold uppercase tracking-wider">
                Soon
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mt-4 border-t border-border pt-4">
        <Link
          href="/my-projects"
          onClick={() => setIsOpen(false)}
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted transition-colors hover:text-[#00AFEF]"
        >
          <ArrowLeft size={17} />
          Back to projects
        </Link>
      </div>
    </>
  );

  return (
    <aside className="w-full shrink-0 lg:w-60">
      {/* Mobile dropdown */}
      <div className="mb-4 lg:hidden">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          className="flex w-full items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-surface-secondary"
        >
          <span className="flex items-center gap-3">
            <LayoutDashboard size={18} className="text-[#00AFEF]" />
            <span>
              <span className="block text-xs text-muted">
                Project Navigation
              </span>
              <span className="block">{activeLabel}</span>
            </span>
          </span>

          <ChevronDown
            size={18}
            className={`text-muted transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && (
          <div className="mt-2 rounded-xl border border-border bg-surface p-4 shadow-lg">
            {navigationContent}
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      <div className="sticky top-24 hidden rounded-2xl border border-border bg-surface p-4 lg:block">
        {navigationContent}
      </div>
    </aside>
  );
}
