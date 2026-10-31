
export default function EmailSettingsSkeleton() {
  return (
    <div className="animate-pulse space-y-8 p-8">

      {/* Page heading */}
      <div className="space-y-2">
        <div className="h-6 w-36 rounded bg-surface-secondary" />
        <div className="h-4 w-72 max-w-full rounded bg-surface-secondary" />
      </div>

      {/* Email address section */}
      <div className="space-y-5 rounded-2xl border border-border bg-surface p-6">

        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-surface-secondary" />
          <div className="h-4 w-28 rounded bg-surface-secondary" />
        </div>

        {/* Current email */}
        <div className="space-y-2">
          <div className="h-3 w-24 rounded bg-surface-secondary" />
          <div className="h-11 w-full rounded-xl bg-surface-secondary" />
        </div>

        {/* New email */}
        <div className="space-y-2">
          <div className="h-3 w-32 rounded bg-surface-secondary" />
          <div className="h-11 w-full rounded-xl bg-surface-secondary" />
        </div>

        {/* Update button */}
        <div className="h-10 w-32 rounded-xl bg-surface-secondary" />
      </div>

      {/* Notification preferences */}
      <div className="space-y-6 rounded-2xl border border-border bg-surface p-6">

        <div className="h-4 w-36 rounded bg-surface-secondary" />

        <div className="space-y-6">
          {[1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className="flex items-start justify-between gap-4"
            >
              <div className="flex-1 space-y-2">
                <div className="h-4 w-36 rounded bg-surface-secondary" />
                <div className="h-3 w-full max-w-sm rounded bg-surface-secondary" />
              </div>

              {/* Toggle placeholder */}
              <div className="h-6 w-11 shrink-0 rounded-full bg-surface-secondary" />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
