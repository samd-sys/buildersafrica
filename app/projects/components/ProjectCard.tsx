
import { Heart, Users, Star, User, Bookmark } from "lucide-react";
import { Project, STAGE_META } from "../types";

type Props = {
  project: Project;
  onViewMore: (project: Project) => void;
  onToggleLike: (id: string) => void;
  onToggleBookmark: (id: string) => void;
};

// Deterministic gradient per project id so each card gets a consistent
// colour without needing a real banner image
const GRADIENTS = [
  "from-purple-900/80 via-purple-800/60 to-indigo-900/80",
  "from-blue-900/80 via-blue-800/60 to-cyan-900/80",
  "from-emerald-900/80 via-emerald-800/60 to-teal-900/80",
  "from-rose-900/80 via-rose-800/60 to-pink-900/80",
  "from-orange-900/80 via-orange-800/60 to-amber-900/80",
  "from-violet-900/80 via-violet-800/60 to-purple-900/80",
];

function gradientForId(id: string) {
  const index =
    id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
    GRADIENTS.length;
  return GRADIENTS[index];
}

export default function ProjectCard({
  project,
  onViewMore,
  onToggleLike,
  onToggleBookmark,
}: Props) {
  const stage = STAGE_META[project.stage] ?? null;
  const gradient = gradientForId(project.id);

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-200 hover:-translate-y-1 hover:border-[#00AFEF]/40">
      {/* Banner */}
      <div className={`relative h-30 overflow-hidden bg-gradient-to-br ${gradient}`}>
        {project.logo_url ? (
          <img
            src={project.logo_url}
            alt={project.title}
            className="h-full w-full object-cover opacity-70"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="select-none text-6xl font-black tracking-tighter text-white/10">
              {project.title.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}

        {/* Stage badge */}
        {stage && (
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-white/20 bg-white/90 px-2.5 py-1 text-[12px] font-semibold text-gray-900 backdrop-blur-sm">
            <span>{stage.label}</span>
          </div>
        )}

        {/* Category badge */}
        {project.category && (
          <div className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
            {project.category}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-4 p-3">
        {/* Title + description */}
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold leading-tight text-foreground">
            {project.title}
          </h3>
          <p className="line-clamp-2 text-xs leading-relaxed text-muted">
            {project.description || "No description provided."}
          </p>
        </div>

        {/* Tech stack */}
        {project.tech_stack && project.tech_stack.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {project.tech_stack.slice(0, 4).map((tech) => (
              <span
                key={tech}
                className="rounded-full border border-border bg-surface-secondary px-2.5 py-0.5 text-[11px] font-medium text-foreground"
              >
                {tech}
              </span>
            ))}
            {project.tech_stack.length > 4 && (
              <span className="rounded-full border border-border bg-surface-secondary px-2.5 py-0.5 text-[11px] text-muted">
                +{project.tech_stack.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between border-t border-border pt-1">
          {/* Founder */}
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-secondary">
              {project.founderAvatar ? (
                <img
                  src={project.founderAvatar}
                  alt={project.founderName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User size={12} className="text-muted" />
              )}
            </div>
            <span className="max-w-[90px] truncate text-xs text-muted">
              {project.founderName}
            </span>
          </div>

          {/* Engagement metrics */}
          <div className="flex items-center gap-3 text-xs text-muted">
            <button
              type="button"
              onClick={() => onToggleLike(project.id)}
              aria-pressed={!!project.isLiked}
              aria-label={project.isLiked ? "Unlike project" : "Like project"}
              className={`flex items-center gap-1 transition-colors ${
                project.isLiked
                  ? "text-[#00AFEF]"
                  : "hover:text-foreground"
              }`}
            >
              <Heart
                size={12}
                className={project.isLiked ? "fill-current" : ""}
              />
              {project.likes}
            </button>

            <span className="flex items-center gap-1">
              <Users size={12} />
              {project.followers}
            </span>

            <span className="flex items-center gap-1">
              <Star size={12} />
              {(project.rating ?? 0).toFixed(1)}
            </span>

            <button
              type="button"
              onClick={() => onToggleBookmark(project.id)}
              aria-pressed={!!project.isBookmarked}
              aria-label={
                project.isBookmarked
                  ? "Remove bookmark"
                  : "Bookmark project"
              }
              className={`transition-colors ${
                project.isBookmarked
                  ? "text-[#00AFEF]"
                  : "hover:text-foreground"
              }`}
            >
              <Bookmark
                size={12}
                className={project.isBookmarked ? "fill-current" : ""}
              />
            </button>
          </div>
        </div>
      </div>

      {/* View More button */}
      <button
        onClick={() => onViewMore(project)}
        className="w-full border-t border-border py-2 text-xs font-semibold text-[#00AFEF] transition-colors hover:bg-[#00AFEF]/10 hover:text-[#00AFEF]/80"
      >
        View More →
      </button>
    </div>
  );
}
