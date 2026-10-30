
import { useEffect, useState } from "react";
import Link from "next/link";

type Props = {
  projectTitle: string;
  onCreateAnother: () => void;
};

export default function SuccessScreen({
  projectTitle,
  onCreateAnother,
}: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div
      className="flex flex-col items-center space-y-8 py-8 text-center"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1)" : "scale(0.95)",
        transition: "all 0.4s ease",
      }}
    >
      {/* Animated checkmark */}
      <div
        className="flex h-24 w-24 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10"
        style={{
          transform: visible ? "scale(1)" : "scale(0.5)",
          transition:
            "transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        }}
      >
        <span className="text-5xl" role="img" aria-label="Success">
          ✅
        </span>
      </div>

      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-foreground">
          Project Created Successfully!
        </h2>

        <p className="text-muted">
          <span className="font-medium text-[#00AFEF]">
            {projectTitle}
          </span>{" "}
          workspace is ready. Start inviting builders and making progress.
        </p>
      </div>

      <div className="flex w-full max-w-sm flex-col items-center gap-3 sm:flex-row">
        <Link
          href="/my-projects"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#00AFEF] py-3 text-sm font-semibold text-white transition-all hover:bg-[#009bd4] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00AFEF] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Go to My Projects →
        </Link>

        <button
          type="button"
          onClick={onCreateAnother}
          className="w-full rounded-xl border border-border bg-surface py-3 text-sm font-medium text-muted transition-colors hover:border-[#00AFEF]/40 hover:bg-surface-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00AFEF] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Create Another Project
        </button>
      </div>
    </div>
  );
}
