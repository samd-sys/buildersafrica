
type Props = { onNext: () => void };

export default function Step1Welcome({ onNext }: Props) {
  return (
    <div className="flex flex-col items-center space-y-8 py-6 text-center">
      <div className="space-y-3">
        <h2 className="text-4xl font-bold text-foreground sm:text-5xl">
          Create Your Project
        </h2>

        <p className="mx-auto max-w-sm leading-relaxed text-muted">
          Let's turn your idea into reality. We'll guide you through a few
          quick questions to create your project workspace.
        </p>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="flex items-center gap-2 rounded-full bg-[#00AFEF] px-8 py-3.5 text-sm font-semibold text-white transition-all hover:bg-[#009bd4] active:scale-[0.98]"
      >
        Start Project →
      </button>
    </div>
  );
}
