
export default function ProjectsSkeleton() {
  const shimmer = "projects-skeleton-shimmer rounded-md";

  return (
    <>
      <style>{`
        @keyframes projects-shimmer {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }

        .projects-skeleton-shimmer {
          background: linear-gradient(
            90deg,
            var(--color-surface-secondary, #27272a) 25%,
            var(--color-surface, #3f3f46) 50%,
            var(--color-surface-secondary, #27272a) 75%
          );
          background-size: 200% 100%;
          animation: projects-shimmer 1.6s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .projects-skeleton-shimmer {
            animation: none;
          }
        }
      `}</style>

      <div
        className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3 xl:gap-6"
        aria-busy="true"
        aria-label="Loading projects"
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="min-w-0 overflow-hidden rounded-xl border border-border bg-surface p-4 sm:p-5"
          >
            {/* Project logo */}
            <div className={`${shimmer} h-32 w-full rounded-lg sm:h-36`} />

            {/* Project title */}
            <div className="mt-4 flex items-center justify-between gap-3">
              <div className={`${shimmer} h-5 w-2/3`} />
              <div className={`${shimmer} h-5 w-16 rounded-full`} />
            </div>

            {/* Description */}
            <div className="mt-4 space-y-2">
              <div className={`${shimmer} h-3 w-full`} />
              <div className={`${shimmer} h-3 w-5/6`} />
              <div className={`${shimmer} h-3 w-2/3`} />
            </div>

            {/* Technology tags */}
            <div className="mt-4 flex flex-wrap gap-2">
              <div className={`${shimmer} h-6 w-16 rounded-full`} />
              <div className={`${shimmer} h-6 w-20 rounded-full`} />
              <div className={`${shimmer} h-6 w-14 rounded-full`} />
            </div>

            {/* Team needs */}
            <div className="mt-5 space-y-2">
              <div className={`${shimmer} h-3 w-24`} />
              <div className="flex gap-2">
                <div className={`${shimmer} h-6 w-20 rounded-full`} />
                <div className={`${shimmer} h-6 w-24 rounded-full`} />
              </div>
            </div>

            {/* Founder */}
            <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
              <div className={`${shimmer} h-9 w-9 shrink-0 rounded-full`} />
              <div className="flex-1 space-y-2">
                <div className={`${shimmer} h-3 w-24`} />
                <div className={`${shimmer} h-3 w-16`} />
              </div>
            </div>

            {/* Engagement buttons */}
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <div className="flex gap-3">
                <div className={`${shimmer} h-5 w-10`} />
                <div className={`${shimmer} h-5 w-10`} />
              </div>
              <div className={`${shimmer} h-8 w-24 rounded-lg`} />
            </div>
          </div>
        ))}
      </div>

      <span className="sr-only">Loading projects...</span>
    </>
  );
}
