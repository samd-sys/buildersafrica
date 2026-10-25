import { ProjectData } from "../../types/project";
import { User } from "lucide-react";

type Props = {
  data: ProjectData;
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </p>
      <div className="text-sm text-white">{value}</div>
    </div>
  );
}

function Tags({ items }: { items: string[] }) {
  if (!items || items.length === 0)
    return <span className="text-gray-500 italic text-xs">None selected</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-lg border border-white/20 bg-[#00AFEF]/10 px-2.5 py-1 text-xs font-medium text-white"
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
        <h2 className="text-2xl font-bold text-white">
          Review your project
        </h2>
      </div>

      <div className="max-h-77 overflow-y-auto overflow-x-hidden rounded-2xl border border-[#1F1F23] bg-[#121215] divide-y divide-[#1F1F23]">
        {/* Logo + name header */}
        <div className="flex items-center gap-4 p-5">
          <div className="h-14 w-14 rounded-xl border border-[#1F1F23] bg-[#0C0C0E] overflow-hidden flex items-center justify-center shrink-0">
            {data.logoUrl ? (
              <img
                src={data.logoUrl}
                alt="Logo"
                className="h-full w-full object-cover"
              />
            ) : (
              <User size={20} className="text-gray-600" />
            )}
          </div>
          <div>
            <p className="text-lg font-bold text-white">
              {data.title || <span className="text-gray-500 italic">Untitled</span>}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              {data.category && (
                <span className="rounded-full border border-white/20 bg-[#00AFEF] px-2.5 py-0.5 text-[10px] font-semibold text-white">
                  {data.category}
                </span>
              )}
              {data.stage && (
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-[10px] font-medium text-gray-400">
                  {data.stage}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-5">
          <Row
            label="Description"
            value={data.description || <span className="text-gray-500 italic">—</span>}
          />
          <Row
            label="Location"
            value={data.location || <span className="text-gray-500 italic">—</span>}
          />
          <Row
            label="Problem Statement"
            value={data.problemStatement || <span className="text-gray-500 italic">—</span>}
          />
          <Row
            label="Vision"
            value={data.vision || <span className="text-gray-500 italic">—</span>}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-5">
          <Row label="Target Audience" value={<Tags items={data.targetAudience} />} />
          <Row label="Tech Stack" value={<Tags items={data.techStack} />} />
          <Row label="Team Needed" value={<Tags items={data.teamNeeds} />} />
        </div>
      </div>
    </div>
  );
}