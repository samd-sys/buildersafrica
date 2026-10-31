"use client";

type MyProjectsSkeletonProps = {
  variant: "projects" | "applications";
};

function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-muted/20 ${className}`}
    />
  );
}

function ProjectCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface">
      {/* Project banner */}
      <Shimmer className="h-36 w-full rounded-none" />

      {/* Project information */}
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="space-y-2">
          <Shimmer className="h-5 w-3/5" />
          <Shimmer className="h-3 w-full" />
          <Shimmer className="h-3 w-4/5" />
        </div>

        <div className="flex flex-wrap gap-3">
          <Shimmer className="h-3 w-20" />
          <Shimmer className="h-3 w-24" />
        </div>

        <div className="flex flex-wrap gap-2">
          <Shimmer className="h-6 w-16 rounded-full" />
          <Shimmer className="h-6 w-20 rounded-full" />
          <Shimmer className="h-6 w-14 rounded-full" />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 border-t border-border px-3 py-3 sm:px-5">
        <Shimmer className="h-8 flex-1 rounded-xl" />
        <Shimmer className="h-8 flex-1 rounded-xl" />
        <Shimmer className="h-8 flex-1 rounded-xl" />
      </div>
    </div>
  );
}

function ApplicationCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface px-3 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
      <Shimmer className="h-12 w-12 shrink-0 rounded-xl" />

      <div className="min-w-0 flex-1 space-y-2">
        <Shimmer className="h-4 w-40 max-w-full" />
        <Shimmer className="h-3 w-32 max-w-full" />
        <Shimmer className="h-3 w-24" />
      </div>

      <div className="flex items-center justify-between gap-2 sm:justify-start">
        <Shimmer className="h-7 w-20 rounded-full" />
        <Shimmer className="h-7 w-24 rounded-xl" />
      </div>
    </div>
  );
}

export default function MyProjectsSkeleton({
  variant,
}: MyProjectsSkeletonProps) {
  if (variant === "applications") {
    return (
      <div className="space-y-6">
        {/* Summary statistics */}
        <div className="grid w-full max-w-xs grid-cols-2 gap-3 sm:gap-4">
          <div className="rounded-xl border border-border bg-surface px-3 py-3 sm:px-4">
            <Shimmer className="mx-auto h-6 w-10" />
            <Shimmer className="mx-auto mt-2 h-3 w-16" />
          </div>

          <div className="rounded-xl border border-border bg-surface px-3 py-3 sm:px-4">
            <Shimmer className="mx-auto h-6 w-10" />
            <Shimmer className="mx-auto mt-2 h-3 w-16" />
          </div>
        </div>

        {/* Accepted applications */}
        <div className="space-y-3">
          <Shimmer className="h-3.5 w-48" />

          {Array.from({ length: 2 }).map((_, index) => (
            <ApplicationCardSkeleton key={`accepted-${index}`} />
          ))}
        </div>

        {/* Pending applications */}
        <div className="space-y-3">
          <Shimmer className="h-3.5 w-36" />

          {Array.from({ length: 3 }).map((_, index) => (
            <ApplicationCardSkeleton key={`pending-${index}`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <ProjectCardSkeleton key={index} />
      ))}
    </div>
  );
}