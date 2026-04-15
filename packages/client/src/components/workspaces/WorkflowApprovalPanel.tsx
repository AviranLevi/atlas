// React / library
import { ArrowRight, CheckCircle2, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Components
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BrainstormOutputView } from './BrainstormOutputView';
import { PlanOutputView } from './PlanOutputView';

// Hooks
import { useUpdateTask } from '@/hooks/use-tasks.hook';
import { useAdvanceWorkflow } from '@/hooks/use-workspaces.hook';

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
  const updateTask = useUpdateTask();

  const stage = workspace.workflowStage;
  if (!stage || stage === 'execute') return null;

  const structuredOutput = tryParseWorkflowOutput(workspace.output);

  // Pre-select the recommended idea for brainstorm stage
  const defaultIdea = useMemo(() => {
    if (structuredOutput?.stage !== 'brainstorm') return undefined;
    return structuredOutput.data.ideas.find((i) => i.recommended)?.title;
  }, [structuredOutput]);

  const [selectedIdea, setSelectedIdea] = useState<string | undefined>(defaultIdea);

  const currentLabel = STAGE_LABELS[stage] ?? stage;
  const nextLabel = NEXT_STAGE_LABELS[stage];

  const handleApprove = () => {
    advance.mutate(
      { workspaceId: workspace.id, selectedApproach: selectedIdea },
      { onSuccess: (newWorkspace) => navigate(`/workspaces/${newWorkspace.id}`) },
    );
  };

  const handleReject = () => {
    updateTask.mutate({ id: workspace.taskId, data: { status: 'To Do' } });
  };

  const isPending = advance.isPending || updateTask.isPending;

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
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
        <CardContent className="flex items-center justify-between gap-4 py-4">
          <div>
            <p className="text-sm font-semibold">{currentLabel} stage complete — awaiting your approval</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {stage === 'brainstorm'
                ? <>Select an approach above, then approve to continue to the <strong>{nextLabel}</strong> stage.</>
                : <>Review the plan above, then approve to continue to the <strong>{nextLabel}</strong> stage, or reject to send the task back to To Do.</>
              }
            </p>
            {(advance.isError || updateTask.isError) && (
              <p className="mt-1 text-xs text-destructive">{((advance.error ?? updateTask.error) as Error).message}</p>
            )}
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
