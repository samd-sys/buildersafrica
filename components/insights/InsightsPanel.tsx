import type { Insight } from "@/lib/insights/types";
import { SectionCard } from "@/components/activity/ActivityWidgets";

/**
 * Plain-language observations about what was recorded. "note" items get a
 * subtle accent so they are easy to find, but never a warning colour.
 */
export default function InsightsPanel({
  insights,
  title = "Insights",
  emptyText = "Not enough recorded activity yet for insights.",
}: {
  insights: Insight[];
  title?: string;
  emptyText?: string;
}) {
  return (
    <SectionCard
      title={title}
      subtitle="Worked out from recorded activity using fixed rules. They describe what was recorded, not why, and are not a measure of productivity."
    >
      {insights.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted">{emptyText}</p>
      ) : (
        <ul className="space-y-3">
          {insights.map((insight) => (
            <li
              key={insight.id}
              className={`rounded-xl border px-4 py-3 ${
                insight.severity === "note"
                  ? "border-[#00AFEF]/30 bg-[#00AFEF]/5"
                  : "border-border bg-surface-secondary"
              }`}
            >
              <p className="text-sm font-semibold text-foreground">{insight.title}</p>
              <p className="mt-1 text-sm text-muted">{insight.detail}</p>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}