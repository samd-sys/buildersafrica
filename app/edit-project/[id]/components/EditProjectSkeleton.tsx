"use client";

export default function EditProjectSkeleton() {
  return (
    <div className="w-full min-w-0 max-w-2xl space-y-4 animate-pulse sm:space-y-6">
      {/* Header */}
      <div className="flex w-full min-w-0 items-center justify-between gap-3">
        <div className="h-5 w-28 shrink-0 rounded-md bg-muted/20" />
        <div className="h-3 w-36 max-w-[45%] rounded-md bg-muted/20" />
      </div>

      {/* Progress bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-3 w-20 rounded bg-muted/20" />
          <div className="h-3 w-16 rounded bg-muted/20" />
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-muted/20">
          <div className="h-full w-1/4 rounded-full bg-[#00AFEF]/20" />
        </div>

        <div className="flex justify-between gap-2">
          {[1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className="h-2 w-8 rounded-full bg-muted/20"
            />
          ))}
        </div>
      </div>

      {/* Form card */}
      <div className="min-h-[340px] space-y-7 overflow-hidden rounded-2xl border border-border bg-surface p-4 shadow-2xl shadow-black/10 sm:min-h-[400px] sm:rounded-3xl sm:p-6 lg:min-h-[420px] lg:rounded-4xl lg:p-8">
        {/* Step heading */}
        <div className="space-y-3">
          <div className="h-6 w-2/3 max-w-xs rounded-md bg-muted/20" />
          <div className="h-4 w-full max-w-md rounded-md bg-muted/20" />
        </div>

        {/* Form label */}
        <div className="space-y-3">
          <div className="h-4 w-28 rounded-md bg-muted/20" />
          <div className="h-12 w-full rounded-xl border border-border bg-muted/10" />
        </div>

        {/* Form description */}
        <div className="space-y-3">
          <div className="h-4 w-36 rounded-md bg-muted/20" />
          <div className="h-28 w-full rounded-xl border border-border bg-muted/10" />
        </div>

        {/* Additional fields */}
        <div className="flex flex-wrap gap-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-8 w-24 rounded-full bg-muted/20"
            />
          ))}
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex w-full items-center justify-between gap-3">
        <div className="h-10 w-24 rounded-xl border border-border bg-muted/10" />
        <div className="h-10 w-28 rounded-xl bg-[#00AFEF]/20" />
      </div>
    </div>
  );
}