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
      <label className="block text-sm font-medium text-white/80">
        {label}
      </label>

      <textarea
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="
          w-full
          rounded-xl
          border border-white/10
          bg-white/5
          px-4
          py-3
          text-white
          placeholder:text-white/30
          outline-none
          transition-all
          duration-200
          hover:border-white/20
          focus:border-cyan-400
          focus:ring-2
          focus:ring-cyan-400/20
          resize-none
        "
      />
    </div>
  );
}