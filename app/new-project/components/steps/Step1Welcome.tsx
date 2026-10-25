type Props = { onNext: () => void };

export default function Step1Welcome({ onNext }: Props) {
  return (
    <div className="flex flex-col items-center text-center space-y-8 py-6">
      <div className="space-y-3">
        <h2 className="text-5xl font-bold text-white">Create Your Project</h2>
        <p className="text-gray-400 max-w-sm mx-auto leading-relaxed">
          Let's turn your idea into reality. We'll guide you through a few
          quick questions to create your project workspace.
        </p>
      </div>
      <button
        onClick={onNext}
        className="flex items-center gap-2 rounded-full bg-white/6 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/10 active:scale-[0.98]"
      >
        Start Project →
      </button>
    </div>
  );
}