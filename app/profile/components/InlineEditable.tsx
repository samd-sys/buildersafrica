
import { useEffect, useRef, useState } from "react";

type InlineEditableProps = {
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
  as?: "input" | "textarea";
  rows?: number;
  inputClassName?: string;
  displayClassName?: string;
  validate?: (value: string) => string | null;
};

export default function InlineEditable({
  value,
  onSave,
  placeholder = "Click to add...",
  as = "input",
  rows = 3,
  inputClassName = "",
  displayClassName = "",
  validate,
}: InlineEditableProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState("");

  const fieldRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!isEditing) {
      setDraft(value);
      setError("");
    }
  }, [value, isEditing]);

  useEffect(() => {
    if (isEditing && fieldRef.current) {
      fieldRef.current.focus();
      fieldRef.current.select();
    }
  }, [isEditing]);

  const commit = () => {
    const trimmed = draft.trim();

    if (validate) {
      const validationError = validate(trimmed);

      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setError("");
    setIsEditing(false);

    if (trimmed !== value) {
      onSave(trimmed);
    }
  };

  const cancel = () => {
    setDraft(value);
    setError("");
    setIsEditing(false);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (e.key === "Enter" && as === "input") {
      e.preventDefault();
      commit();
    }

    if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  };

  if (isEditing) {
    const sharedClassName = `w-full bg-surface border ${
      error ? "border-red-500" : "border-border"
    } rounded-lg px-2.5 py-1.5 text-foreground outline-none focus:border-[#00AFEF] focus:ring-1 focus:ring-[#00AFEF]/30 transition-colors placeholder:text-muted ${inputClassName}`;

    return (
      <div className="w-full">
        {as === "textarea" ? (
          <textarea
            ref={fieldRef as React.RefObject<HTMLTextAreaElement>}
            rows={rows}
            value={draft}
            placeholder={placeholder}
            onChange={(e) => {
              setDraft(e.target.value);
              if (error) setError("");
            }}
            onBlur={commit}
            onKeyDown={handleKeyDown}
            className={`${sharedClassName} resize-none`}
          />
        ) : (
          <input
            ref={fieldRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={draft}
            placeholder={placeholder}
            onChange={(e) => {
              setDraft(e.target.value);
              if (error) setError("");
            }}
            onBlur={commit}
            onKeyDown={handleKeyDown}
            className={sharedClassName}
          />
        )}

        {error && (
          <p className="mt-1.5 text-[11px] leading-relaxed text-red-500">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={() => setIsEditing(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setIsEditing(true);
        }
      }}
      title="Click to edit"
      aria-label={`Edit ${value || placeholder}`}
      className={`cursor-pointer rounded-md -mx-1 px-1 transition-colors hover:bg-surface-secondary ${
        !value ? "text-muted italic" : "text-foreground"
      } ${displayClassName}`}
    >
      {value || placeholder}
    </span>
  );
}
