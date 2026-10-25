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
        border-[#1F1F23]
        bg-[#121215]
        p-5
        transition-all
        duration-200
        hover:border-white/10
        ${className}
      `}
    >
      {children}
    </div>
  );
}