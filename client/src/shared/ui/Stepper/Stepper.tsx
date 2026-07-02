import { Check } from 'lucide-react';

interface StepDef {
  readonly label: string;
}

interface StepperProps {
  readonly steps: readonly StepDef[];
  readonly currentStep: number;
  readonly className?: string;
}

export const Stepper = ({
  steps,
  currentStep,
  className = '',
}: StepperProps): React.JSX.Element => (
  <nav aria-label="Postęp" className={`flex items-center ${className}`}>
    {steps.map((step, i) => {
      const isCompleted = i < currentStep;
      const isActive = i === currentStep;

      return (
        <div key={step.label} className="flex flex-1 items-center">
          <div className="flex items-center gap-2">
            <span
              aria-current={isActive ? 'step' : undefined}
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                isCompleted
                  ? 'bg-primary text-primary-foreground'
                  : isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border bg-surface text-muted-foreground'
              }`}
            >
              {isCompleted ? <Check size={14} /> : i + 1}
            </span>
            <span
              className={`text-sm whitespace-nowrap ${
                isActive
                  ? 'font-medium text-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`mx-3 h-px flex-1 ${
                i < currentStep ? 'bg-primary' : 'bg-border'
              }`}
            />
          )}
        </div>
      );
    })}
  </nav>
);
