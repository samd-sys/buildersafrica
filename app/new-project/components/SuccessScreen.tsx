import { useEffect, useState } from "react";
import Link from "next/link";

type Props = {
  projectTitle: string;
  onCreateAnother: () => void;
};

export default function SuccessScreen({ projectTitle, onCreateAnother }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="flex flex-col items-center text-center space-y-8 py-8"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1)" : "scale(0.95)",
        transition: "all 0.4s ease",
      }}
    >
      {/* Animated checkmark */}
      <div
        className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20"
        style={{
          transform: visible ? "scale(1)" : "scale(0.5)",
          transition: "transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        }}
      >
        <span className="text-5xl">✅</span>
      </div>

      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-white">
          Project Created Successfully!
        </h2>
        <p className="text-gray-400">
          <span className="text-[#00AFEF] font-medium">{projectTitle}</span>{" "}
          workspace is ready. Start inviting builders and making progress.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm">
        <Link
          href="/my-projects"
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#00AFEF]/40 py-3 text-sm font-semibold text-white transition-all hover:bg-[#00AFEF]/20 active:scale-[0.98]"
        >
          Go to My Projects →
        </Link>
        <button
          onClick={onCreateAnother}
          className="w-full rounded-xl border border-[#1F1F23] bg-[#121215] py-3 text-sm font-medium text-gray-300 hover:text-white hover:border-white/10 transition-colors"
        >
          Create Another Project
        </button>
      </div>
    </div>
  );
}