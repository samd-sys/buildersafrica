"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Page frame shared by the activity dashboards. It follows the same layout
 * conventions as the existing pages, including shifting aside when the
 * sidebar is hovered.
 */
export default function PageShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  useEffect(() => {
    const handleSidebarHover = (event: Event) => {
      const detail = (event as CustomEvent<{ isHovered?: boolean }>).detail;
      setIsSidebarHovered(Boolean(detail?.isHovered));
    };

    window.addEventListener("sidebarHover", handleSidebarHover);
    return () => window.removeEventListener("sidebarHover", handleSidebarHover);
  }, []);

  return (
    <div
      className={`min-h-screen overflow-x-hidden bg-background text-foreground transition-all duration-500 ease-in-out ${
        isSidebarHovered ? "ml-0 md:ml-16" : "ml-0"
      }`}
    >
      <div className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-4 sm:py-8 lg:px-6 lg:py-10">
        <div className="rounded-2xl border border-border bg-surface-secondary/60 p-3 sm:p-5">
          <div className="space-y-6 sm:space-y-8">
            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface px-4 py-5 sm:px-6 sm:py-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-8">
              <div className="min-w-0 space-y-1.5">
                <h1 className="break-words text-2xl font-bold text-foreground sm:text-3xl">
                  {title}
                </h1>
                {description && (
                  <p className="max-w-2xl text-sm text-muted">{description}</p>
                )}
              </div>
              {actions}
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}