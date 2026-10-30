
type Props = {
  currentStep: number;
  totalSteps: number;
};

export default function ProgressBar({ currentStep, totalSteps }: Props) {
  const percent = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted">
        <span className="font-medium text-foreground">
          Step {currentStep}{" "}
          <span className="text-muted">of {totalSteps}</span>
        </span>

        <span className="font-semibold text-[#00AFEF]">
          {percent}% Complete
        </span>
      </div>

      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-surface-secondary"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Project creation progress"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#00AFEF] to-purple-400 transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
