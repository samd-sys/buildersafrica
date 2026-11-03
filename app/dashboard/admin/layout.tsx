
"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ShieldCheck } from "lucide-react";

const TABS = [
  { href: "/dashboard/admin", label: "Overview", exact: true },
  { href: "/dashboard/admin/support", label: "Support Inbox", exact: false },
];

// Reusable skeleton block
function Skeleton({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-surface-secondary ${className}`}
    />
  );
}

// Admin dashboard loading skeleton
function AdminSkeleton() {
  return (
    <main className="min-h-screen bg-background p-4 text-foreground sm:p-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        {/* Header skeleton */}
        <header className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-56 max-w-full" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </header>

        {/* Navigation skeleton */}
        <nav className="flex gap-5 border-b border-border pb-3">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-32" />
        </nav>

        {/* Dashboard content skeleton */}
        <section className="space-y-6">
          {/* Stats cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-xl border border-border bg-surface p-5 space-y-4"
              >
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-36 max-w-full" />
              </div>
            ))}
          </div>

          {/* Main content cards */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="rounded-xl border border-border bg-surface p-5 space-y-5"
              >
                <Skeleton className="h-5 w-40" />

                {Array.from({ length: 3 }).map((_, row) => (
                  <div
                    key={row}
                    className="flex items-center gap-3"
                  >
                    <Skeleton className="h-10 w-10 shrink-0 rounded-full" />

                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-2/3" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>

                    <Skeleton className="h-7 w-16" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (cancelled) return;

        if (authError || !user) {
          router.replace("/login");
          return;
        }

        const { data: admin, error } = await supabase
          .from("support_admins")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (cancelled) return;

        if (error || !admin) {
          router.replace("/projects");
          return;
        }

        setAllowed(true);
      } catch (error) {
        console.error("Admin access check failed:", error);

        if (!cancelled) {
          router.replace("/projects");
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    };

    check();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.replace("/login");
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [router]);

  // Show skeleton while checking admin access
  if (checking || !allowed) {
    return <AdminSkeleton />;
  }

  return (
    <main className="min-h-screen bg-background p-4 text-foreground sm:p-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#00AFEF]">
            <ShieldCheck size={15} />
            ADMINISTRATION
          </div>

          <h1 className="text-2xl font-bold tracking-tight">
            Admin Dashboard
          </h1>

          <p className="mt-1 text-sm text-muted">
            Manage and monitor your BuildersAfrica platform.
          </p>
        </header>

        <nav
          aria-label="Admin sections"
          className="flex gap-1 overflow-x-auto border-b border-border"
        >
          {TABS.map((tab) => {
            const active = tab.exact
              ? pathname === tab.href
              : pathname.startsWith(tab.href);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`-mb-px shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "border-[#00AFEF] text-foreground"
                    : "border-transparent text-muted hover:text-foreground"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        {children}
      </div>
    </main>
  );
}
