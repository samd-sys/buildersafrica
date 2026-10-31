
export default function ApplicationFormSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl animate-pulse space-y-6 px-4 py-10">

        {/* Back link */}
        <div className="h-5 w-36 rounded-md bg-surface-secondary" />

        {/* Project and position header */}
        <div className="space-y-4 rounded-2xl border border-border bg-surface px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-surface-secondary" />

            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 rounded bg-surface-secondary" />
              <div className="h-6 w-2/3 max-w-xs rounded bg-surface-secondary" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-surface-secondary" />
            <div className="h-3 w-5/6 rounded bg-surface-secondary" />
          </div>
        </div>

        {/* Full name */}
        <div className="space-y-2">
          <div className="h-3 w-24 rounded bg-surface-secondary" />
          <div className="h-12 w-full rounded-xl bg-surface-secondary" />
        </div>

        {/* Experience */}
        <div className="space-y-2">
          <div className="h-3 w-36 rounded bg-surface-secondary" />
          <div className="h-32 w-full rounded-xl bg-surface-secondary" />
        </div>

        {/* Skills */}
        <div className="space-y-2">
          <div className="h-3 w-16 rounded bg-surface-secondary" />
          <div className="flex min-h-[52px] flex-wrap items-center gap-2 rounded-xl bg-surface-secondary px-4 py-3">
            <div className="h-6 w-20 rounded-lg bg-border/60" />
            <div className="h-6 w-24 rounded-lg bg-border/60" />
            <div className="h-4 w-28 rounded bg-border/60" />
          </div>
        </div>

        {/* Portfolio links */}
        <div className="space-y-2">
          <div className="h-3 w-36 rounded bg-surface-secondary" />
          <div className="h-12 w-full rounded-xl bg-surface-secondary" />
          <div className="h-4 w-28 rounded bg-surface-secondary" />
        </div>

        {/* Motivation */}
        <div className="space-y-2">
          <div className="h-3 w-52 rounded bg-surface-secondary" />
          <div className="h-32 w-full rounded-xl bg-surface-secondary" />
          <div className="flex justify-end">
            <div className="h-3 w-16 rounded bg-surface-secondary" />
          </div>
        </div>

        {/* Submit button */}
        <div className="h-12 w-full rounded-xl bg-surface-secondary" />

      </div>
    </div>
  );
}
