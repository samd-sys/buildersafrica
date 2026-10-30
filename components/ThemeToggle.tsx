
"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

type Props = {
  showLabel?: boolean;
};

export default function ThemeToggle({ showLabel = true }: Props) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  // Prevent incorrect theme rendering before mounting
  if (!mounted) {
    return (
      <button
        disabled
        className="flex items-center gap-2 rounded-lg border border-border bg-surface-secondary px-3 py-2 text-foreground opacity-70"
        aria-label="Toggle theme"
      >
        <Sun className="h-5 w-5 text-amber-500" />
        {showLabel && (
          <span className="text-sm font-medium">Theme</span>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 rounded-lg border border-border bg-surface-secondary px-3 py-2 text-foreground transition-colors hover:bg-surface"
      aria-label="Toggle theme"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun className="h-5 w-5 shrink-0 text-white/50" />
      ) : (
        <Moon className="h-5 w-5 shrink-0 text-[#00AFEF]" />
      )}

      {showLabel && (
        <span className="text-sm font-medium text-foreground">
          {isDark ? "Light" : "Dark"}
        </span>
      )}
    </button>
  );
}
