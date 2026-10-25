import { User } from "lucide-react";
import { Builder } from "../types/builder";
import { countryToFlag } from "../lib/countryFlag";

type Props = {
  builder: Builder;
  onOpenProfile: (builder: Builder) => void;
};

export default function BuilderCard({ builder, onOpenProfile }: Props) {
  return (
    <div
      onClick={() => onOpenProfile(builder)}
      className="group flex h-full cursor-pointer flex-col rounded-2xl border border-white/10 bg-[#121215] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-white/20"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#27272A] bg-[#18181B]">
          {builder.avatar_url ? (
            <img
              src={builder.avatar_url}
              alt={builder.full_name}
              className="h-full w-full object-cover"
            />
          ) : (
            <User size={20} className="text-gray-600" />
          )}
        </div>

        <div className="min-w-0">
          <h3 className="truncate font-semibold text-white">
            {builder.full_name || "Unnamed Builder"}
          </h3>
          <p className="flex items-center gap-1 truncate text-xs text-gray-400">
            <span>{countryToFlag(builder.country)}</span>
            <span>{builder.country || "Location not set"}</span>
          </p>
        </div>
      </div>

      <p className="mt-4 flex-1 text-sm text-gray-400 line-clamp-3">
        {builder.bio || "This builder hasn't added a bio yet."}
      </p>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onOpenProfile(builder);
        }}
        className="mt-4 w-39 ml-17 rounded-xl border border-white/10 bg-black/16 py-2.5 text-sm font-medium text-white transition-colors group-hover:bg-white/10 group-hover:text-purple-200"
      >
        Open Profile
      </button>
    </div>
  );
}