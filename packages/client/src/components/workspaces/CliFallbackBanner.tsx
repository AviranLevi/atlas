// React / library
import { AlertTriangle } from 'lucide-react';

// Components
import { HintDot } from '@/components/onboarding/HintDot';

// Types
import type { Workspace } from '@atlas/shared';

import { TOUR_TARGETS } from '@/lib/tours/tour-targets';

/**
 * Persistent notice shown on a workspace whose brainstorm/plan stage fell
 * back to CLI execution because no API provider could be resolved. Renders
 * nothing when the workspace ran as intended.
 */
export function CliFallbackBanner({ workspace }: { workspace: Workspace }) {
  if (!workspace.providerFallbackReason) return null;

  const isStructuredStage = workspace.workflowStage === 'brainstorm' || workspace.workflowStage === 'plan';
  if (!isStructuredStage) return null;

  return (
    <HintDot id="cli-fallback" anchor="top-right" dismissOnChildClick={false} className="relative block">
      <div
        data-tour={TOUR_TARGETS.workspaceCliBanner}
        role="status"
        className="flex w-full items-start gap-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3"
      >
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div className="space-y-1 text-sm">
          <p className="font-medium text-foreground">Fell back to CLI execution</p>
          <p className="text-muted-foreground">
            {workspace.providerFallbackReason}. That&apos;s why this {workspace.workflowStage} produced prose instead of
            structured output.
          </p>
          <p className="text-muted-foreground">
            Attach an API provider to this agent (or pick one in the start-work dialog) to get structured output on
            future runs.
          </p>
        </div>
      </div>
    </HintDot>
  );
}
