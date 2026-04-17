// React / library
import { AlertTriangle, FileCode, GitCommit } from 'lucide-react';

// Components
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Types
import type { PlanOutput } from '@atlas/shared';

const COMPLEXITY_COLORS: Record<string, string> = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const RISK_COLORS: Record<string, string> = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

type PlanOutputViewProps = {
  plan: PlanOutput;
};

export function PlanOutputView({ plan }: PlanOutputViewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold">Implementation Plan</h3>
        <Badge className={COMPLEXITY_COLORS[plan.estimatedComplexity]}>
          {plan.estimatedComplexity} complexity
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground">{plan.summary}</p>

      <ol className="space-y-3">
        {plan.steps.map((step) => (
          <li key={step.order} className="rounded-lg border p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {step.order}. {step.title}
              </span>
              <Badge variant="outline" className={RISK_COLORS[step.risk]}>
                {step.risk} risk
              </Badge>
            </div>
            {step.file && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                <FileCode className="h-3 w-3" />
                {step.file}
              </p>
            )}
            <p className="text-sm text-muted-foreground">{step.description}</p>
          </li>
        ))}
      </ol>

      {plan.concerns.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Concerns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-4 space-y-1">
              {plan.concerns.map((concern, i) => (
                <li key={i} className="text-sm text-muted-foreground">{concern}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {plan.commitSteps && plan.commitSteps.length > 0 && (
        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <GitCommit className="h-4 w-4 text-muted-foreground" />
            Commit Plan
          </h3>
          <p className="text-xs text-muted-foreground">
            The execute agent will follow these atomic commits in order.
          </p>
          <div className="space-y-2">
            {plan.commitSteps.map((step) => (
              <div key={step.step} className="flex gap-3 rounded-md border px-3 py-2 text-sm">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  {step.step}
                </span>
                <div className="min-w-0 space-y-0.5">
                  <p className="font-medium">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {step.files.map((f) => (
                      <code key={f} className="rounded bg-muted px-1 py-0.5 text-[10px]">
                        {f}
                      </code>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
