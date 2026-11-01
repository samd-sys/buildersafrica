
export default function ProjectsSkeleton() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-[1600px] px-3 py-5 sm:px-5 sm:py-6 md:h-full md:px-6 md:py-8">
      <div className="animate-pulse space-y-4 sm:space-y-5">
        {/* Project Header */}
        <div className="w-full min-w-0 rounded-xl border border-border bg-surface px-4 py-4 sm:rounded-2xl sm:px-6 sm:py-5 md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="h-9 w-28 rounded-full bg-surface-secondary" />
            <div className="h-10 w-32 rounded-full bg-surface-secondary" />
          </div>
        </div>

        {/* Search Bar */}
        <div className="h-12 w-full rounded-xl border border-border bg-surface-secondary" />

        {/* Filters */}
        <div className="space-y-3 pt-1">
          <div className="flex flex-wrap items-center gap-3">
            <div className="h-10 w-28 rounded-xl bg-surface-secondary" />
            <div className="h-10 w-32 rounded-xl bg-surface-secondary" />
            <div className="h-10 w-28 rounded-xl bg-surface-secondary" />
            <div className="h-10 w-24 rounded-xl bg-surface-secondary" />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="h-9 w-24 rounded-full bg-surface-secondary" />
            <div className="h-9 w-28 rounded-full bg-surface-secondary" />
            <div className="h-9 w-24 rounded-full bg-surface-secondary" />
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-5 flex items-center gap-2 px-1 sm:mt-6">
          <div className="h-4 w-4 rounded bg-surface-secondary" />
          <div className="h-4 w-32 rounded bg-surface-secondary" />
        </div>

        {/* Project Cards */}
        <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 pb-5 sm:mt-6 sm:grid-cols-2 sm:gap-5 sm:pb-8 xl:grid-cols-3 xl:gap-6">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="min-w-0 overflow-hidden rounded-2xl border border-border bg-surface"
            >
              {/* Card Banner */}
              <div className="h-32 w-full bg-surface-secondary sm:h-36" />

              <div className="space-y-4 p-4 sm:p-5">
                {/* Project Title and Category */}
                <div className="space-y-2">
                  <div className="h-5 w-3/4 rounded bg-surface-secondary" />
                  <div className="h-3 w-1/3 rounded bg-surface-secondary" />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <div className="h-3 w-full rounded bg-surface-secondary" />
                  <div className="h-3 w-5/6 rounded bg-surface-secondary" />
                  <div className="h-3 w-2/3 rounded bg-surface-secondary" />
                </div>

                {/* Technology Tags */}
                <div className="flex flex-wrap gap-2">
                  <div className="h-6 w-16 rounded-full bg-surface-secondary" />
                  <div className="h-6 w-20 rounded-full bg-surface-secondary" />
                  <div className="h-6 w-14 rounded-full bg-surface-secondary" />
                </div>

                {/* Founder Information */}
                <div className="flex items-center gap-3 border-t border-border pt-4">
                  <div className="h-9 w-9 shrink-0 rounded-full bg-surface-secondary" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-28 rounded bg-surface-secondary" />
                    <div className="h-2.5 w-20 rounded bg-surface-secondary" />
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <div className="flex gap-3">
                    <div className="h-7 w-12 rounded-lg bg-surface-secondary" />
                    <div className="h-7 w-12 rounded-lg bg-surface-secondary" />
                  </div>
                  <div className="h-8 w-24 rounded-full bg-surface-secondary" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
