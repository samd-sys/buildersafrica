
import React from "react";

type SectionCardProps = {
  children: React.ReactNode;
  className?: string;
};

export default function SectionCard({
  children,
  className = "",
}: SectionCardProps) {
  return (
    <div
      className={`
        relative
        overflow-hidden
        rounded-2xl
        border
        border-border
        bg-surface
        p-5
        transition-all
        duration-200
        hover:border-[#00AFEF]/40
        ${className}
      `}
    >
      {children}
    </div>
  );
}
