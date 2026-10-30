
import { ProjectData } from "../../types/project";
import { User } from "lucide-react";

type Props = {
  data: ProjectData;
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </p>
      <div className="text-sm text-foreground">{value}</div>
    </div>
  );
}

function Tags({ items }: { items: string[] }) {
  if (!items || items.length === 0) {
    return (
      <span className="text-xs italic text-muted">
        None selected
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-lg border border-[#00AFEF]/30 bg-[#00AFEF]/10 px-2.5 py-1 text-xs font-medium text-foreground"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export default function Step13Review({ data }: Props) {
  return (
    <div className="-mt-6 space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-foreground">
          Review your project
        </h2>
      </div>

      <div className="max-h-77 divide-y divide-border overflow-x-hidden overflow-y-auto rounded-2xl border border-border bg-surface">
        {/* Logo + name header */}
        <div className="flex items-center gap-4 p-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface-secondary">
            {data.logoUrl ? (
              <img
                src={data.logoUrl}
                alt="Project logo"
                className="h-full w-full object-cover"
              />
            ) : (
              <User size={20} className="text-muted" />
            )}
          </div>

          <div>
            <p className="text-lg font-bold text-foreground">
              {data.title || (
                <span className="italic text-muted">Untitled</span>
              )}
            </p>

            <div className="mt-0.5 flex items-center gap-2">
              {data.category && (
                <span className="rounded-full border border-[#00AFEF]/40 bg-[#00AFEF] px-2.5 py-0.5 text-[10px] font-semibold text-white">
                  {data.category}
                </span>
              )}

              {data.stage && (
                <span className="rounded-full border border-border bg-surface-secondary px-2.5 py-0.5 text-[10px] font-medium text-muted">
                  {data.stage}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
          <Row
            label="Description"
            value={
              data.description || (
                <span className="italic text-muted">—</span>
              )
            }
          />

          <Row
            label="Location"
            value={
              data.location || (
                <span className="italic text-muted">—</span>
              )
            }
          />

          <Row
            label="Problem Statement"
            value={
              data.problemStatement || (
                <span className="italic text-muted">—</span>
              )
            }
          />

          <Row
            label="Vision"
            value={
              data.vision || (
                <span className="italic text-muted">—</span>
              )
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
          <Row
            label="Target Audience"
            value={<Tags items={data.targetAudience} />}
          />

          <Row
            label="Tech Stack"
            value={<Tags items={data.techStack} />}
          />

          <Row
            label="Team Needed"
            value={<Tags items={data.teamNeeds} />}
          />
        </div>
      </div>
    </div>
  );
}
