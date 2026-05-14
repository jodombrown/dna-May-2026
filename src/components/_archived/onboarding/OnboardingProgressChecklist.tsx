
import React from "react";

interface Props {
  stepStatus: Record<string, boolean>;
  stepLabels: Record<string, string>;
  onboardingSteps: string[];
}

const OnboardingProgressChecklist: React.FC<Props> = ({
  stepStatus,
  stepLabels,
  onboardingSteps,
}) => (
  <div className="flex flex-col gap-2">
    {onboardingSteps.map((step) => (
      <div className="flex items-center" key={step}>
        <span
          className={`w-5 h-5 rounded-full inline-flex justify-center items-center mr-2
            ${stepStatus[step]
              ? "bg-dna-emerald text-white"
              : "bg-neutral-200 text-neutral-500"}`}
        >
          {stepStatus[step]
            ? "✓"
            : onboardingSteps.findIndex((s) => !stepStatus[s]) === onboardingSteps.indexOf(step)
            ? "→"
            : ""}
        </span>
        <span className={stepStatus[step] ? "font-semibold text-dna-emerald" : ""}>
          {stepLabels[step]}
        </span>
      </div>
    ))}
  </div>
);

export default OnboardingProgressChecklist;
