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
      {/* Label context */}
      <div className="flex items-center gap-1">
        <label className="text-sm font-medium text-gray-300">
          {label}
        </label>
        {required && (
          <span className="text-red-400 text-xs">*</span>
        )}
      </div>

      {/* Input background container matching target system spec */}
      <div
        className={`
          flex items-center
          rounded-xl
          border
          bg-[#0D0D0D]/40
          transition-all
          duration-200
          ${
            error
              ? "border-red-500/80 focus-within:border-red-400"
              : "border-white/5 hover:border-white/10 focus-within:border-[#6366F1]"
          }
        `}
      >
        {icon && (
          <div className="pl-4 text-white/30">
            {icon}
          </div>
        )}

        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="
            w-full
            bg-transparent
            px-4
            py-3
            text-sm
            text-white
            placeholder:text-white/20
            outline-none
          "
        />
      </div>

      {/* Helper text block info */}
      {!error && helperText && (
        <p className="text-xs text-white/40 px-1">
          {helperText}
        </p>
      )}

      {/* Field Validation warnings */}
      {error && (
        <p className="text-xs text-red-400 px-1">
          {error}
        </p>
      )}
    </div>
  );
}