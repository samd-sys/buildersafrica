
type TextAreaFieldProps = {
  label: string;
  placeholder?: string;
  value: string;
  rows?: number;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
};

export default function TextAreaField({
  label,
  placeholder,
  value,
  rows = 5,
  onChange,
}: TextAreaFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">
        {label}
      </label>

      <textarea
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="
          w-full
          resize-none
          rounded-xl
          border border-border
          bg-surface-secondary
          px-4
          py-3
          text-foreground
          placeholder:text-muted/60
          outline-none
          transition-all
          duration-200
          hover:border-[#00AFEF]/40
          focus:border-[#00AFEF]
          focus:ring-2
          focus:ring-[#00AFEF]/20
        "
      />
    </div>
  );
}
