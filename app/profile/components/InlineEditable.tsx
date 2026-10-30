
import { useEffect, useRef, useState } from "react";

type InlineEditableProps = {
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
  as?: "input" | "textarea";
  rows?: number;
  inputClassName?: string;
  displayClassName?: string;
};

/**
 * Renders `value` as plain text. Clicking it swaps the text for an
 * input (or textarea) in the exact same spot. Enter / blur commits
 * the change via onSave, Escape cancels back to the previous value.
 *
 * This is the building block behind every "click any element to
 * edit it" field in ProfilePreview.
 */
export default function InlineEditable({
  value,
  onSave,
  placeholder = "Click to add...",
  as = "input",
  rows = 3,
  inputClassName = "",
  displayClassName = "",
}: InlineEditableProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const fieldRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  // Keep the draft synchronized when the external value changes
  // while the field isn't actively being edited.
  useEffect(() => {
    if (!isEditing) setDraft(value);
  }, [value, isEditing]);

  useEffect(() => {
    if (isEditing && fieldRef.current) {
      fieldRef.current.focus();
      fieldRef.current.select();
    }
  }, [isEditing]);

  const commit = () => {
    setIsEditing(false);
    const trimmed = draft.trim();

    if (trimmed !== value) {
      onSave(trimmed);
    }
  };

  const cancel = () => {
    setDraft(value);
    setIsEditing(false);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    // Enter commits single-line fields; textarea Enter adds a new line.
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
    const sharedClassName = `w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-foreground outline-none focus:border-[#00AFEF] focus:ring-1 focus:ring-[#00AFEF]/30 transition-colors placeholder:text-muted ${inputClassName}`;

    if (as === "textarea") {
      return (
        <textarea
          ref={fieldRef as React.RefObject<HTMLTextAreaElement>}
          rows={rows}
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          className={`${sharedClassName} resize-none`}
        />
      );
    }

    return (
      <input
        ref={fieldRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className={sharedClassName}
      />
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
