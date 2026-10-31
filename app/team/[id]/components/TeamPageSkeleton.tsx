"use client";

export default function TeamPageSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 animate-pulse">
      {/* Back link */}
      <div className="h-5 w-28 rounded-md bg-muted/20" />

      {/* Team header */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 shrink-0 rounded-2xl bg-muted/20" />

          <div className="flex-1 space-y-3">
            <div className="h-6 w-2/3 max-w-xs rounded-md bg-muted/20" />
            <div className="h-4 w-full max-w-md rounded-md bg-muted/20" />
            <div className="h-4 w-3/4 max-w-sm rounded-md bg-muted/20" />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="h-9 w-28 rounded-lg bg-muted/20" />
          <div className="h-9 w-24 rounded-lg bg-muted/20" />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="rounded-xl border border-border p-4 space-y-2"
            >
              <div className="h-3 w-20 rounded bg-muted/20" />
              <div className="h-6 w-12 rounded bg-muted/20" />
            </div>
          ))}
        </div>
      </div>

      {/* Members section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-36 rounded-md bg-muted/20" />
          <div className="h-9 w-28 rounded-lg bg-muted/20" />
        </div>

        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"
          >
            <div className="h-12 w-12 shrink-0 rounded-full bg-muted/20" />

            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-36 max-w-full rounded bg-muted/20" />
              <div className="h-3 w-28 max-w-full rounded bg-muted/20" />
              <div className="h-3 w-24 max-w-full rounded bg-muted/20" />
            </div>

            <div className="hidden h-8 w-24 rounded-lg bg-muted/20 sm:block" />
            <div className="h-8 w-8 rounded-lg bg-muted/20" />
          </div>
        ))}
      </div>
    </div>
  );
}