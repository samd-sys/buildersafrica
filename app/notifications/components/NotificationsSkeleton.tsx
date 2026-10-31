
export default function NotificationsSkeleton() {
  const shimmer = "notifications-skeleton-shimmer rounded-md";

  return (
    <>
      <style>{`
        @keyframes notifications-shimmer {
          0% {
            background-position: 100% 0;
          }
          100% {
            background-position: -100% 0;
          }
        }

        .notifications-skeleton-shimmer {
          background: linear-gradient(
            90deg,
            var(--color-surface-secondary, #27272a) 25%,
            var(--color-surface, #3f3f46) 50%,
            var(--color-surface-secondary, #27272a) 75%
          );
          background-size: 200% 100%;
          animation: notifications-shimmer 1.6s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .notifications-skeleton-shimmer {
            animation: none;
          }
        }
      `}</style>

      <div
        className="mx-auto flex w-full max-w-3xl flex-col space-y-4 px-3 py-4 sm:px-5 sm:py-6 md:h-full md:min-h-0 md:space-y-6 md:px-6 md:py-8"
        aria-busy="true"
        aria-label="Loading notifications"
      >
        {/* Header skeleton */}
        <div className="shrink-0 rounded-xl border border-border bg-surface px-4 py-4 sm:rounded-2xl sm:px-6 sm:py-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={`${shimmer} h-10 w-10 shrink-0 rounded-xl`}
              />

              <div className="min-w-0 flex-1 space-y-2">
                <div className={`${shimmer} h-5 w-32`} />
                <div className={`${shimmer} h-3 w-40 max-w-full`} />
              </div>
            </div>

            <div className={`${shimmer} h-8 w-8 shrink-0 rounded-full`} />
          </div>
        </div>

        {/* Tabs skeleton */}
        <div className="shrink-0">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 py-3"
              >
                <div className={`${shimmer} h-4 w-4 rounded-full`} />
                <div className={`${shimmer} h-3 w-16 max-w-full`} />
              </div>
            ))}
          </div>
        </div>

        {/* Toolbar skeleton */}
        <div className="shrink-0 flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className={`${shimmer} h-3 w-28`} />
            <div className={`${shimmer} h-3 w-16`} />
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end sm:gap-3">
            <div className={`${shimmer} h-9 w-28 rounded-lg`} />
            <div className={`${shimmer} h-9 w-28 rounded-lg`} />
          </div>
        </div>

        {/* Notification cards */}
        <div className="space-y-2 md:min-h-0 md:flex-1 md:overflow-hidden">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border border-border bg-surface p-3 sm:p-4"
            >
              <div className="flex items-start gap-3">
                {/* Avatar / notification icon */}
                <div
                  className={`${shimmer} h-10 w-10 shrink-0 rounded-full`}
                />

                {/* Notification content */}
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className={`${shimmer} h-3 w-32 max-w-full`} />
                    <div className={`${shimmer} h-3 w-16`} />
                  </div>

                  <div className="space-y-2">
                    <div className={`${shimmer} h-3 w-full`} />
                    <div className={`${shimmer} h-3 w-4/5`} />
                  </div>

                  {/* Notification actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <div className={`${shimmer} h-7 w-20 rounded-lg`} />
                    <div className={`${shimmer} h-7 w-20 rounded-lg`} />
                  </div>
                </div>

                {/* Unread indicator */}
                <div
                  className={`${shimmer} mt-1 h-2 w-2 shrink-0 rounded-full`}
                />
              </div>
            </div>
          ))}
        </div>

        <span className="sr-only">Loading notifications...</span>
      </div>
    </>
  );
}
