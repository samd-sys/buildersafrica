
import React from "react";

type SectionTitleProps = {
  title: string;
  description?: string;
};

export default function SectionTitle({
  title,
  description,
}: SectionTitleProps) {
  return (
    <div className="mb-4 px-1">
      <h3 className="text-sm font-semibold text-muted tracking-wider uppercase">
        {title}
      </h3>

      {description && (
        <p className="mt-1 text-xs text-muted">
          {description}
        </p>
      )}
    </div>
  );
}
