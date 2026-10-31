"use client";

type MessagesSkeletonProps = {
  isSidebarHovered?: boolean;
};

function Shimmer({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-muted/20 ${className}`}
    />
  );
}

export default function MessagesSkeleton({
  isSidebarHovered = false,
}: MessagesSkeletonProps) {
  return (
    <main
      className={`mt-3 flex h-[calc(100dvh-1.5rem)] min-h-[32rem] w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-border bg-background sm:mt-4 sm:rounded-2xl md:mt-6 md:h-[calc(100dvh-1.5rem)] ${
        isSidebarHovered ? "md:ml-6" : "md:ml-14"
      }`}
      style={{
        transition: "margin 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* Left panel: conversation list skeleton */}
      <aside className="flex h-full w-full min-w-0 flex-col bg-sidebar md:w-72 md:shrink-0 lg:w-80">
        {/* Header */}
        <div className="shrink-0 space-y-4 border-b border-border px-3 py-3 sm:px-4 sm:py-4">
          <div className="flex items-center gap-2">
            <Shimmer className="h-4 w-4 rounded-full" />
            <Shimmer className="h-4 w-20" />
          </div>

          {/* Chat mode toggle */}
          <div className="flex h-10 items-center gap-2 rounded-xl border border-border bg-surface p-1">
            <Shimmer className="h-full flex-1 rounded-lg" />
            <Shimmer className="h-full flex-1 rounded-lg" />
          </div>
        </div>

        {/* Search placeholder */}
        <div className="shrink-0 px-3 pt-4 sm:px-4">
          <Shimmer className="h-10 w-full rounded-xl" />
        </div>

        {/* Conversation items */}
        <div className="min-h-0 flex-1 space-y-2 overflow-hidden px-2 py-3 sm:px-3">
          {Array.from({ length: 7 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-xl p-3"
            >
              <Shimmer className="h-11 w-11 shrink-0 rounded-full" />

              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Shimmer className="h-3.5 w-28 max-w-[65%]" />
                  <Shimmer className="h-3 w-10" />
                </div>

                <Shimmer className="h-3 w-4/5" />
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Right panel: chat skeleton (desktop) */}
      <section className="hidden h-full min-h-0 min-w-0 flex-1 flex-col md:flex">
        {/* Chat header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-surface px-5 py-4">
          <div className="flex items-center gap-3">
            <Shimmer className="h-10 w-10 rounded-full" />

            <div className="space-y-2">
              <Shimmer className="h-3.5 w-32" />
              <Shimmer className="h-3 w-20" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Shimmer className="h-8 w-8 rounded-lg" />
            <Shimmer className="h-8 w-8 rounded-lg" />
            <Shimmer className="h-8 w-8 rounded-lg" />
          </div>
        </div>

        {/* Chat messages */}
        <div className="flex min-h-0 flex-1 flex-col justify-end gap-5 overflow-hidden p-5 lg:p-7">
          <div className="flex items-end gap-2">
            <Shimmer className="h-8 w-8 shrink-0 rounded-full" />
            <Shimmer className="h-14 w-56 max-w-[65%] rounded-2xl" />
          </div>

          <div className="flex justify-end">
            <Shimmer className="h-12 w-64 max-w-[70%] rounded-2xl" />
          </div>

          <div className="flex items-end gap-2">
            <Shimmer className="h-8 w-8 shrink-0 rounded-full" />
            <Shimmer className="h-20 w-72 max-w-[70%] rounded-2xl" />
          </div>

          <div className="flex justify-end">
            <Shimmer className="h-14 w-52 max-w-[65%] rounded-2xl" />
          </div>

          <div className="flex items-end gap-2">
            <Shimmer className="h-8 w-8 shrink-0 rounded-full" />
            <Shimmer className="h-12 w-48 max-w-[65%] rounded-2xl" />
          </div>
        </div>

        {/* Message input */}
        <div className="shrink-0 border-t border-border p-4">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-3">
            <Shimmer className="h-7 w-7 rounded-lg" />
            <Shimmer className="h-4 flex-1" />
            <Shimmer className="h-9 w-9 rounded-lg" />
          </div>
        </div>
      </section>
    </main>
  );
}