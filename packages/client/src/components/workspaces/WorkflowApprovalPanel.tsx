// React / library
import { ArrowRight, CheckCircle2, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Components
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MarkdownContent } from '@/components/ui/markdown-content';
import { BrainstormOutputView } from './BrainstormOutputView';
import { PlanOutputView } from './PlanOutputView';

// Hooks
import { useAdvanceWorkflow, useRejectWorkflow } from '@/hooks/use-workspaces.hook';

// Lib
import { tryParseWorkflowOutput } from '@/lib/workflow-output';

// Types
import type { Workspace } from '@atlas/shared';

const STAGE_LABELS: Record<string, string> = {
  brainstorm: 'Brainstorm',
  plan: 'Plan',
  execute: 'Execute',
};

const NEXT_STAGE_LABELS: Record<string, string> = {
  brainstorm: 'Plan',
  plan: 'Execute',
};

type WorkflowApprovalPanelProps = {
  workspace: Workspace;
};

export function WorkflowApprovalPanel({ workspace }: WorkflowApprovalPanelProps) {
  const navigate = useNavigate();
  const advance = useAdvanceWorkflow();
  const reject = useRejectWorkflow();

  const stage = workspace.workflowStage;
  const structuredOutput = tryParseWorkflowOutput(workspace.output);

  // Pre-select the recommended idea for brainstorm stage.
  // Hooks must run unconditionally — early return is AFTER all hook calls.
  const defaultIdea = useMemo(() => {
    if (structuredOutput?.stage !== 'brainstorm') return undefined;
    return structuredOutput.data.ideas.find((i) => i.recommended)?.title;
  }, [structuredOutput]);

  const [selectedIdea, setSelectedIdea] = useState<string | undefined>(defaultIdea);

  // Guard goes here, after every hook, so the hook call order is always the same.
  if (!stage || stage === 'execute') return null;

  const currentLabel = STAGE_LABELS[stage] ?? stage;
  const nextLabel = NEXT_STAGE_LABELS[stage];

  const handleApprove = () => {
    advance.mutate(
      { workspaceId: workspace.id, selectedApproach: selectedIdea },
      {
        onSuccess: (newWorkspace) => navigate(`/workspaces/${newWorkspace.id}`),
        onError: (err) => toast.error(`Failed to advance: ${(err as Error).message}`),
      },
    );
  };

  const handleReject = () => {
    reject.mutate(workspace.id, {
      onSuccess: () => {
        toast.success('Rejected — task sent back to To Do');
        navigate('/workspaces');
      },
      onError: (err) => toast.error(`Reject failed: ${(err as Error).message}`),
    });
  };

  const isPending = advance.isPending || reject.isPending;

  return (
    <div className="space-y-4">
      {structuredOutput?.stage === 'plan' && <PlanOutputView plan={structuredOutput.data} />}
      {structuredOutput?.stage === 'brainstorm' && (
        <BrainstormOutputView
          brainstorm={structuredOutput.data}
          selectedIdea={selectedIdea}
          onSelectIdea={setSelectedIdea}
        />
      )}
      {!structuredOutput && workspace.output && (
        <div className="rounded-md border border-border bg-muted/30 p-4">
          <MarkdownContent content={workspace.output} />
        </div>
      )}
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
        <CardContent className="flex items-center justify-between gap-4 py-4">
          <div>
            <p className="text-sm font-semibold">{currentLabel} stage complete — awaiting your approval</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {stage === 'brainstorm' ? (
                <>
                  Select an approach above, then approve to continue to the <strong>{nextLabel}</strong> stage.
                </>
              ) : (
                <>
                  Review the plan above, then approve to continue to the <strong>{nextLabel}</strong> stage, or reject
                  to send the task back to To Do.
                </>
              )}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="sm" onClick={handleReject} disabled={isPending}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Reject
            </Button>
            <Button size="sm" onClick={handleApprove} disabled={isPending}>
              {advance.isPending ? (
                'Starting…'
              ) : (
                <>
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  Approve & start {nextLabel}
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
