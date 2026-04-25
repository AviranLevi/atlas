// React / library
import { Check } from 'lucide-react';

// Lib
import { cn } from '@/lib/utils';

export type StepIndicatorStep = {
  id: string;
  label: string;
};

type StepIndicatorProps = {
  steps: StepIndicatorStep[];
  currentIndex: number;
};

export function StepIndicator({ steps, currentIndex }: StepIndicatorProps) {
  return (
    <ol className="flex items-center gap-2" aria-label="Onboarding progress">
      {steps.map((step, idx) => {
        const isComplete = idx < currentIndex;
        const isCurrent = idx === currentIndex;

        return (
          <li key={step.id} className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full border text-xs font-medium',
                isComplete && 'border-primary bg-primary text-primary-foreground',
                isCurrent && 'border-primary bg-primary/10 text-primary',
                !isComplete && !isCurrent && 'border-border text-muted-foreground',
              )}
              aria-current={isCurrent ? 'step' : undefined}
            >
              {isComplete ? <Check className="h-3.5 w-3.5" /> : idx + 1}
            </div>
            <span
              className={cn(
                'text-xs font-medium',
                isCurrent ? 'text-foreground' : 'text-muted-foreground',
                'hidden sm:inline',
              )}
            >
              {step.label}
            </span>
            {idx < steps.length - 1 && <div className="mx-1 h-px w-6 bg-border sm:w-10" />}
          </li>
        );
      })}
    </ol>
  );
}
