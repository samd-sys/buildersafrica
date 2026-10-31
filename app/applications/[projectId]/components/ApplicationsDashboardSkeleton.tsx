"use client";

export default function ApplicationsDashboardSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 animate-pulse">
      {/* Back link */}
      <div className="h-5 w-28 rounded-md bg-muted/20" />

      {/* Project header */}
      <div className="space-y-4 rounded-2xl border border-border bg-surface px-6 py-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="h-12 w-12 shrink-0 rounded-xl bg-muted/20" />

            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3 w-24 rounded bg-muted/20" />
              <div className="h-5 w-48 max-w-full rounded bg-muted/20" />
            </div>
          </div>

          <div className="h-9 w-24 shrink-0 rounded-full bg-muted/20" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="rounded-xl border border-border bg-surface-secondary px-4 py-3"
            >
              <div className="mx-auto mb-2 h-6 w-10 rounded bg-muted/20" />
              <div className="mx-auto h-3 w-14 rounded bg-muted/20" />
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-border bg-surface p-1">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-9 flex-1 rounded-lg bg-muted/20"
          />
        ))}
      </div>

      {/* Applicant cards */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="space-y-4 rounded-2xl border border-border bg-surface p-5"
          >
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 shrink-0 rounded-full bg-muted/20" />

              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-40 max-w-full rounded bg-muted/20" />
                <div className="h-3 w-28 max-w-full rounded bg-muted/20" />
                <div className="h-3 w-36 max-w-full rounded bg-muted/20" />
              </div>

              <div className="h-6 w-20 shrink-0 rounded-full bg-muted/20" />
            </div>

            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-muted/20" />
              <div className="h-3 w-4/5 rounded bg-muted/20" />
            </div>

            <div className="flex flex-wrap gap-2">
              {[1, 2, 3].map((tag) => (
                <div
                  key={tag}
                  className="h-6 w-16 rounded-full bg-muted/20"
                />
              ))}
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <div className="h-9 w-20 rounded-lg bg-muted/20" />
              <div className="h-9 w-20 rounded-lg bg-muted/20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}