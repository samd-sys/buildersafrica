
export default function ApplyProjectSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-10 animate-pulse">

        {/* Back link */}
        <div className="h-5 w-36 rounded-md bg-surface-secondary" />

        {/* Project header */}
        <div className="space-y-5 rounded-2xl border border-border bg-surface px-6 py-6">

          <div className="flex items-center gap-4">
            {/* Project logo */}
            <div className="h-14 w-14 shrink-0 rounded-xl bg-surface-secondary" />

            {/* Project information */}
            <div className="min-w-0 flex-1 space-y-3">
              <div className="h-3 w-28 rounded bg-surface-secondary" />
              <div className="h-7 w-2/3 max-w-xs rounded bg-surface-secondary" />
              <div className="h-4 w-full max-w-md rounded bg-surface-secondary" />
            </div>
          </div>

          {/* Position count and applications link */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="h-7 w-32 rounded-full bg-surface-secondary" />
            <div className="h-7 w-36 rounded-full bg-surface-secondary" />
          </div>
        </div>

        {/* Positions grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="space-y-4 rounded-2xl border border-border bg-surface p-5"
            >
              {/* Position title */}
              <div className="h-6 w-2/3 rounded bg-surface-secondary" />

              {/* Position description */}
              <div className="space-y-2">
                <div className="h-3 w-full rounded bg-surface-secondary" />
                <div className="h-3 w-5/6 rounded bg-surface-secondary" />
                <div className="h-3 w-2/3 rounded bg-surface-secondary" />
              </div>

              {/* Skills/tags */}
              <div className="flex gap-2">
                <div className="h-6 w-16 rounded-full bg-surface-secondary" />
                <div className="h-6 w-20 rounded-full bg-surface-secondary" />
                <div className="h-6 w-14 rounded-full bg-surface-secondary" />
              </div>

              {/* Action button */}
              <div className="h-10 w-full rounded-lg bg-surface-secondary" />
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
