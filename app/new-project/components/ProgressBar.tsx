type Props = {
  currentStep: number;
  totalSteps: number;
};

export default function ProgressBar({ currentStep, totalSteps }: Props) {
  const percent = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span className="font-medium text-white">
          Step {currentStep}{" "}
          <span className="text-gray-500">of {totalSteps}</span>
        </span>
        <span className="font-semibold text-[#00AFEF]">{percent}% Complete</span>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1F1F23]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#00AFEF] to-purple-400 transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}