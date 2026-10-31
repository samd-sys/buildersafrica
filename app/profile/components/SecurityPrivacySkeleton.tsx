
export default function SecurityPrivacySkeleton() {
  return (
    <div className="animate-pulse space-y-8 bg-background p-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-6 w-44 rounded-lg bg-surface-secondary" />
        <div className="h-3 w-72 max-w-full rounded bg-surface-secondary" />
      </div>

      {/* Change Password */}
      <div className="space-y-5 rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-surface-secondary" />
          <div className="h-4 w-32 rounded bg-surface-secondary" />
        </div>

        {[1, 2, 3].map((item) => (
          <div key={item} className="space-y-2">
            <div className="h-3 w-32 rounded bg-surface-secondary" />
            <div className="h-11 w-full rounded-xl bg-surface-secondary" />
          </div>
        ))}

        <div className="h-9 w-36 rounded-xl bg-surface-secondary" />
      </div>

      {/* Privacy Settings */}
      <div className="space-y-5 rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-surface-secondary" />
          <div className="h-4 w-28 rounded bg-surface-secondary" />
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="h-4 w-36 rounded bg-surface-secondary" />
            <div className="h-3 w-full max-w-md rounded bg-surface-secondary" />
            <div className="h-3 w-52 max-w-full rounded bg-surface-secondary" />
          </div>

          <div className="h-6 w-11 shrink-0 rounded-full bg-surface-secondary" />
        </div>
      </div>
    </div>
  );
}
