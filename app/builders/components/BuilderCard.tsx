
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
      className="group flex h-full cursor-pointer flex-col rounded-2xl border border-border bg-surface p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#00AFEF]/50"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-secondary">
          {builder.avatar_url ? (
            <img
              src={builder.avatar_url}
              alt={builder.full_name}
              className="h-full w-full object-cover"
            />
          ) : (
            <User size={20} className="text-muted" />
          )}
        </div>

        <div className="min-w-0">
          <h3 className="truncate font-semibold text-foreground">
            {builder.full_name || "Unnamed Builder"}
          </h3>

          <p className="flex items-center gap-1 truncate text-xs text-muted">
            <span>{countryToFlag(builder.country)}</span>
            <span>{builder.country || "Location not set"}</span>
          </p>
        </div>
      </div>

      <p className="mt-4 line-clamp-3 flex-1 text-sm text-muted">
        {builder.bio || "This builder hasn't added a bio yet."}
      </p>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenProfile(builder);
        }}
        className="mt-4 ml-17 w-39 rounded-xl border border-border bg-surface-secondary py-2.5 text-sm font-medium text-foreground transition-colors group-hover:border-[#00AFEF]/40 group-hover:bg-[#00AFEF]/10 group-hover:text-[#00AFEF]"
      >
        Open Profile
      </button>
    </div>
  );
}
