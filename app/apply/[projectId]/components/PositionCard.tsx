
import { useRouter } from "next/navigation";
import { Position } from "../types";
import { ArrowRight, Briefcase } from "lucide-react";

type Props = {
  position: Position;
  projectId: string;
  isFounder: boolean;
  hasApplied: boolean;
};

export default function PositionCard({
  position,
  projectId,
  isFounder,
  hasApplied,
}: Props) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 transition-all duration-200 hover:border-[#00AFEF]/40 hover:shadow-lg hover:shadow-[#00AFEF]/5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-secondary">
          <Briefcase size={18} className="text-[#00AFEF]" />
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-bold text-foreground">
            {position.title}
          </h3>

          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            ● Open
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="flex-1 text-sm leading-relaxed text-muted">
        {position.description}
      </p>

      {/* Apply button */}
      {isFounder ? (
        <div className="rounded-xl border border-border bg-surface-secondary py-2.5 text-center text-xs text-muted">
          You own this project
        </div>
      ) : hasApplied ? (
        <div className="rounded-xl border border-[#00AFEF]/20 bg-[#00AFEF]/5 py-2.5 text-center text-xs font-semibold text-[#00AFEF]">
          ✓ Already Applied
        </div>
      ) : (
        <button
          onClick={() =>
            router.push(`/apply/${projectId}/${position.id}`)
          }
          className="flex items-center justify-center gap-2 rounded-xl bg-[#00AFEF] py-2.5 text-sm font-semibold text-slate-950 transition-all hover:bg-[#00AFEF]/80 active:scale-[0.98]"
        >
          Apply for this role
          <ArrowRight size={15} />
        </button>
      )}
    </div>
  );
}
