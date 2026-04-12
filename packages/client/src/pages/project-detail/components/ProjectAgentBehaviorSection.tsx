// React / library
import { Bot } from 'lucide-react';

// Components
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

// Hooks
import { useUpdateProject } from '@/hooks/use-projects.hook';

// Types
import type { AgentBehavior, Project } from '@atlas/shared';

type ProjectAgentBehaviorSectionProps = {
  project: Project;
};

const DEFAULT_BEHAVIOR: AgentBehavior = {
  requireVerification: true,
  enforceNoStubs: true,
  workflowMode: 'off',
  autoAiReview: false,
};

export function ProjectAgentBehaviorSection({ project }: ProjectAgentBehaviorSectionProps) {
  const updateProject = useUpdateProject();
  const behavior: AgentBehavior = { ...DEFAULT_BEHAVIOR, ...(project.agentBehavior ?? {}) };

  const update = (patch: Partial<AgentBehavior>) => {
    updateProject.mutate({ id: project.id, data: { agentBehavior: { ...behavior, ...patch } } });
  };

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Bot className="text-muted-foreground h-4 w-4" />
        <h2 className="text-sm font-semibold">Agent Behavior</h2>
        <Badge variant="outline" className="text-[10px] text-muted-foreground">
          applied to all agents in this project
        </Badge>
      </div>

      <div className="divide-y rounded-lg border">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <Label className="text-sm">Require Verification</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Agents must run tests and paste output before marking a task done
            </p>
          </div>
          <Switch
            checked={behavior.requireVerification}
            onCheckedChange={(val) => update({ requireVerification: val })}
            disabled={updateProject.isPending}
          />
        </div>

        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <Label className="text-sm">Enforce No Stubs</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Agents may not submit TODO comments, placeholder values, or stub implementations
            </p>
          </div>
          <Switch
            checked={behavior.enforceNoStubs}
            onCheckedChange={(val) => update({ enforceNoStubs: val })}
            disabled={updateProject.isPending}
          />
        </div>

        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex-1">
            <Label className="text-sm">Workflow Mode</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add approval gates between planning stages before the agent executes
            </p>
          </div>
          <Select
            value={behavior.workflowMode}
            onValueChange={(val) => update({ workflowMode: val as AgentBehavior['workflowMode'] })}
            disabled={updateProject.isPending}
          >
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="off">Off</SelectItem>
              <SelectItem value="plan-only">Plan only</SelectItem>
              <SelectItem value="full">Full (brainstorm → plan → execute)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {behavior.workflowMode !== 'off' && (
          <>
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <Label className="text-sm">Require approval after Brainstorm</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pause for your review when the brainstorm stage finishes (defaults on)
                </p>
              </div>
              <Switch
                checked={behavior.approvalGates?.brainstorm ?? true}
                onCheckedChange={(val) =>
                  update({
                    approvalGates: {
                      brainstorm: val,
                      plan: behavior.approvalGates?.plan ?? true,
                    },
                  })
                }
                disabled={updateProject.isPending}
              />
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <Label className="text-sm">Require approval after Plan</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pause for your review when the plan stage finishes (defaults on)
                </p>
              </div>
              <Switch
                checked={behavior.approvalGates?.plan ?? true}
                onCheckedChange={(val) =>
                  update({
                    approvalGates: {
                      brainstorm: behavior.approvalGates?.brainstorm ?? true,
                      plan: val,
                    },
                  })
                }
                disabled={updateProject.isPending}
              />
            </div>
          </>
        )}

        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <Label className="text-sm">Auto AI Review</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Automatically trigger a review workspace when a task is completed
            </p>
          </div>
          <Switch
            checked={behavior.autoAiReview}
            onCheckedChange={(val) => update({ autoAiReview: val })}
            disabled={updateProject.isPending}
          />
        </div>
      </div>

      {updateProject.isError && <p className="mt-2 text-sm text-destructive">{updateProject.error.message}</p>}
    </section>
  );
}
