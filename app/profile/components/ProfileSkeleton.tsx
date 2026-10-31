"use client";

type ProfileSkeletonProps = {
  isSidebarHovered?: boolean;
};

function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-muted/20 ${className}`}
    />
  );
}

function FieldSkeleton({
  width = "w-28",
}: {
  width?: string;
}) {
  return (
    <div className="space-y-2">
      <Shimmer className={`h-3.5 ${width}`} />
      <Shimmer className="h-10 w-full rounded-xl" />
    </div>
  );
}

export default function ProfileSkeleton({
  isSidebarHovered = false,
}: ProfileSkeletonProps) {
  return (
    <main
      className={`mt-3 flex h-[calc(100dvh-1.5rem)] min-h-0 w-full min-w-0 max-w-full flex-col overflow-hidden rounded-xl border border-border bg-background text-foreground sm:mt-4 sm:rounded-2xl md:mt-6 ${
        isSidebarHovered ? "md:ml-6" : "md:ml-14"
      }`}
      style={{
        transition: "margin 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="mx-auto h-full min-h-0 w-full max-w-7xl overflow-y-auto px-2 py-3 sm:px-4 sm:py-4 md:px-5 lg:px-6">
          <div className="space-y-6">
            {/* Page heading */}
            <div className="space-y-2">
              <Shimmer className="h-6 w-36" />
              <Shimmer className="h-3.5 w-64 max-w-full" />
            </div>

            {/* Profile overview */}
            <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Shimmer className="h-20 w-20 shrink-0 rounded-full" />

                <div className="min-w-0 flex-1 space-y-2">
                  <Shimmer className="h-4 w-40 max-w-full" />
                  <Shimmer className="h-3.5 w-56 max-w-full" />
                  <Shimmer className="h-3 w-32 max-w-full" />
                </div>

                <Shimmer className="h-9 w-28 rounded-xl" />
              </div>
            </section>

            {/* Profile details */}
            <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
              <div className="mb-5 space-y-2">
                <Shimmer className="h-4 w-36" />
                <Shimmer className="h-3 w-60 max-w-full" />
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <FieldSkeleton width="w-24" />
                <FieldSkeleton width="w-32" />

                <div className="space-y-2 md:col-span-2">
                  <Shimmer className="h-3.5 w-20" />
                  <Shimmer className="h-24 w-full rounded-xl" />
                </div>

                <FieldSkeleton width="w-20" />
                <FieldSkeleton width="w-28" />

                {/* Skills */}
                <div className="space-y-3 md:col-span-2">
                  <Shimmer className="h-3.5 w-16" />
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <Shimmer
                        key={index}
                        className={`h-8 ${
                          index % 2 === 0 ? "w-20" : "w-28"
                        } rounded-full`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Social links */}
            <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
              <div className="mb-5 space-y-2">
                <Shimmer className="h-4 w-28" />
                <Shimmer className="h-3 w-52 max-w-full" />
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <FieldSkeleton width="w-16" />
                <FieldSkeleton width="w-20" />
                <FieldSkeleton width="w-16" />
              </div>
            </section>

            {/* Visibility and regions */}
            <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
              <div className="mb-5 space-y-2">
                <Shimmer className="h-4 w-32" />
                <Shimmer className="h-3 w-64 max-w-full" />
              </div>

              <Shimmer className="h-12 w-full rounded-xl" />

              <div className="mt-5 space-y-3">
                <Shimmer className="h-3.5 w-28" />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 rounded-xl border border-border p-3"
                    >
                      <Shimmer className="h-4 w-4 rounded" />
                      <Shimmer className="h-3 w-20 max-w-full" />
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
              <Shimmer className="h-10 w-24 rounded-xl" />
              <Shimmer className="h-10 w-32 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}