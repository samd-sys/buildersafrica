
import React from "react";

type InputFieldProps = {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  icon?: React.ReactNode;
};

export default function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  helperText,
  error,
  icon,
}: InputFieldProps) {
  return (
    <div className="space-y-2">
      {/* Label */}
      <div className="flex items-center gap-1">
        <label className="text-sm font-medium text-foreground">
          {label}
          {required && (
            <span className="ml-1 text-red-500 text-xs">*</span>
          )}
        </label>
      </div>

      {/* Input container */}
      <div
        className={`
          flex items-center
          rounded-xl
          border
          bg-surface
          transition-all
          duration-200
          ${
            error
              ? "border-red-500/80 focus-within:border-red-500"
              : "border-border hover:border-[#00AFEF]/50 focus-within:border-[#00AFEF]"
          }
        `}
      >
        {icon && (
          <div className="pl-4 text-muted" aria-hidden="true">
            {icon}
          </div>
        )}

        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          aria-invalid={!!error}
          className="
            w-full
            bg-transparent
            px-4
            py-3
            text-sm
            text-foreground
            placeholder:text-muted
            outline-none
          "
        />
      </div>

      {/* Helper text */}
      {!error && helperText && (
        <p className="px-1 text-xs text-muted">
          {helperText}
        </p>
      )}

      {/* Validation error */}
      {error && (
        <p className="px-1 text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
