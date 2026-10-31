
export default function BuildersSkeleton() {
  const skeleton = "builders-skeleton-shimmer rounded-md";

  return (
    <div
      className="mx-auto w-full max-w-none space-y-4 px-3 py-4 sm:px-5 sm:py-6 md:px-6 md:py-8"
      aria-busy="true"
      aria-label="Loading builders"
    >
      <style>{`
        @keyframes builders-shimmer {
          0% {
            background-position: 100% 0;
          }
          100% {
            background-position: -100% 0;
          }
        }

        .builders-skeleton-shimmer {
          background: linear-gradient(
            90deg,
            var(--color-surface-secondary, #27272a) 25%,
            var(--color-surface, #3f3f46) 50%,
            var(--color-surface-secondary, #27272a) 75%
          );
          background-size: 200% 100%;
          animation: builders-shimmer 1.6s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .builders-skeleton-shimmer {
            animation: none;
          }
        }
      `}</style>

      {/* Online status and action button */}
      <div className="rounded-xl border border-border bg-surface p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className={`${skeleton} h-3 w-3 rounded-full`} />
            <div className={`${skeleton} h-4 w-36`} />
          </div>

          <div className={`${skeleton} h-10 w-full rounded-full sm:w-44`} />
        </div>
      </div>

      {/* AI Search bar */}
      <div className="flex justify-center">
        <div className="w-full max-w-3xl">
          <div className="rounded-xl border border-border bg-surface p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className={`${skeleton} h-5 w-5 rounded-full`} />

              <div className="flex-1 space-y-2">
                <div className={`${skeleton} h-3 w-32`} />
                <div className={`${skeleton} h-4 w-3/4`} />
              </div>

              <div className={`${skeleton} h-9 w-16 rounded-lg`} />
            </div>
          </div>
        </div>
      </div>

      {/* Results heading */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className={`${skeleton} h-4 w-4 rounded-full`} />
          <div className={`${skeleton} h-4 w-28`} />
        </div>
      </div>

      {/* Builder cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-border bg-surface p-4 sm:p-5"
          >
            {/* Avatar and builder information */}
            <div className="flex items-center gap-3">
              <div className={`${skeleton} h-14 w-14 shrink-0 rounded-full`} />

              <div className="min-w-0 flex-1 space-y-2">
                <div className={`${skeleton} h-4 w-2/3`} />
                <div className={`${skeleton} h-3 w-1/2`} />
              </div>
            </div>

            {/* Bio */}
            <div className="mt-5 space-y-2">
              <div className={`${skeleton} h-3 w-full`} />
              <div className={`${skeleton} h-3 w-5/6`} />
              <div className={`${skeleton} h-3 w-2/3`} />
            </div>

            {/* Skills */}
            <div className="mt-5 flex flex-wrap gap-2">
              <div className={`${skeleton} h-6 w-16 rounded-full`} />
              <div className={`${skeleton} h-6 w-20 rounded-full`} />
              <div className={`${skeleton} h-6 w-14 rounded-full`} />
            </div>

            {/* Location and profile action */}
            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
              <div className={`${skeleton} h-3 w-24`} />
              <div className={`${skeleton} h-9 w-24 rounded-lg`} />
            </div>
          </div>
        ))}
      </div>

      <span className="sr-only">Loading builders...</span>
    </div>
  );
}
