// React / library
import { AlertTriangle, GitBranch, Info, Lightbulb, Play } from 'lucide-react';
import { type ReactElement, useEffect, useMemo, useState } from 'react';

// Components
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { BranchSelect } from './BranchSelect';
import { ModelSection } from './ModelSection';
import { RuntimeSelect } from './RuntimeSelect';
import { TaskSummary } from './TaskSummary';

// Hooks
import { useAgentProviders, useProviderModels } from '@/hooks/use-agent-providers.hook';
import { useAgent } from '@/hooks/use-agents.hook';
import { useCreateBranch, useProject, useProjectBranches } from '@/hooks/use-projects.hook';
import { useAgentRuntimes, useStartWork } from '@/hooks/use-workspaces.hook';

// Types
import type { ModelPreset } from '@atlas/shared';
import type { StartWorkDialogProps } from './workspaces.types';

// Constants
import {
  CUSTOM_MODEL_VALUE,
  DEFAULT_BRANCH_VALUE,
  DEFAULT_MODEL_VALUE,
  ESTIMATE_MODEL_HINT,
  getModelStorageKey,
  NEW_BRANCH_VALUE,
  RUNTIME_STORAGE_KEY,
} from './workspaces.constants';

export function StartWorkDialog({
  open,
  onOpenChange,
  task,
  agentName,
  projectName,
  projectId,
}: StartWorkDialogProps): ReactElement {
  const { data: runtimes = [], isLoading: runtimesLoading } = useAgentRuntimes();
  const { data: branches = [], isLoading: branchesLoading } = useProjectBranches(projectId);
  const { data: project } = useProject(projectId);
  const { data: agent } = useAgent(task?.agentId ?? undefined);
  const { data: providers = [] } = useAgentProviders();
  const { data: providerModels = [], isLoading: providerModelsLoading } = useProviderModels(
    agent?.providerId ?? undefined,
  );
  const startWork = useStartWork();
  const createBranch = useCreateBranch(projectId);

  const [selectedRuntime, setSelectedRuntime] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>(DEFAULT_BRANCH_VALUE);
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL_VALUE);
  const [customModelText, setCustomModelText] = useState<string>('');
  const [newBranchName, setNewBranchName] = useState<string>('');
  const projectWorkflowMode = project?.agentBehavior?.workflowMode ?? 'off';
  const [workflowEnabled, setWorkflowEnabled] = useState(projectWorkflowMode !== 'off');
  const [workflowProviderId, setWorkflowProviderId] = useState<string>('');

  const currentRuntime = useMemo(() => runtimes.find((r) => r.id === selectedRuntime), [runtimes, selectedRuntime]);

  useEffect(() => {
    if (agent?.providerId && providers.some((p) => p.id === agent.providerId)) {
      setWorkflowProviderId(agent.providerId);
    } else if (providers.length > 0) {
      setWorkflowProviderId(providers[0].id);
    } else {
      setWorkflowProviderId('');
    }
  }, [agent?.providerId, providers]);

  useEffect(() => {
    if (runtimes.length === 0 || selectedRuntime) return;
    const saved = localStorage.getItem(RUNTIME_STORAGE_KEY);
    if (saved) {
      const runtime = runtimes.find((r) => r.id === saved);
      if (runtime?.installed && runtime?.authenticated) {
        setSelectedRuntime(saved);
      }
    }
  }, [runtimes, selectedRuntime]);

  useEffect(() => {
    if (!selectedRuntime) return;
    const rt = runtimes.find((r) => r.id === selectedRuntime);
    const presetValues = new Set(rt?.modelPresets?.map((p: ModelPreset) => p.value) ?? []);
    const isCompatible = (model: string) => presetValues.size === 0 || presetValues.has(model);

    const savedModel = localStorage.getItem(getModelStorageKey(selectedRuntime));
    if (savedModel && isCompatible(savedModel)) {
      setSelectedModel(savedModel);
    } else if (agent?.defaultModel && isCompatible(agent.defaultModel)) {
      setSelectedModel(agent.defaultModel);
    } else {
      setSelectedModel(DEFAULT_MODEL_VALUE);
    }
    setCustomModelText('');
  }, [selectedRuntime, agent?.defaultModel, runtimes]);

  useEffect(() => {
    if (open) {
      setSelectedBranch(DEFAULT_BRANCH_VALUE);
      setNewBranchName('');
      createBranch.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, createBranch.reset]);

  const handleRuntimeChange = (value: string) => {
    setSelectedRuntime(value);
    localStorage.setItem(RUNTIME_STORAGE_KEY, value);
  };

  const handleModelChange = (value: string) => {
    setSelectedModel(value);
    if (value !== DEFAULT_MODEL_VALUE && value !== CUSTOM_MODEL_VALUE) {
      localStorage.setItem(getModelStorageKey(selectedRuntime), value);
    }
    if (value !== CUSTOM_MODEL_VALUE) setCustomModelText('');
  };

  const handleBranchChange = (value: string) => {
    setSelectedBranch(value);
    if (value !== NEW_BRANCH_VALUE) {
      setNewBranchName('');
      createBranch.reset();
    }
  };

  const doStartWork = (baseBranch?: string) => {
    if (!task || !selectedRuntime) return;

    let model: string | undefined;
    if (selectedModel === CUSTOM_MODEL_VALUE && customModelText.trim()) {
      model = customModelText.trim();
    } else if (selectedModel !== DEFAULT_MODEL_VALUE && selectedModel !== CUSTOM_MODEL_VALUE) {
      model = selectedModel;
    }

    startWork.mutate(
      {
        taskId: task.id,
        agentRuntimeId: selectedRuntime,
        baseBranch,
        model,
        providerId: (workflowEnabled && workflowProviderId) ? workflowProviderId : (agent?.providerId ?? undefined),
        workflowEnabled,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  const handleStart = () => {
    if (selectedBranch === NEW_BRANCH_VALUE && newBranchName.trim()) {
      createBranch.mutate({ name: newBranchName.trim() }, { onSuccess: (data) => doStartWork(data.branch) });
    } else {
      const baseBranch = selectedBranch !== DEFAULT_BRANCH_VALUE ? selectedBranch : undefined;
      doStartWork(baseBranch);
    }
  };

  const isNewBranchInvalid = selectedBranch === NEW_BRANCH_VALUE && !newBranchName.trim();
  const isPending = startWork.isPending || createBranch.isPending;

  const defaultBranchLabel = project?.defaultBranch || 'auto-detect';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Start Work
          </DialogTitle>
          <DialogDescription>Spawn an agent to work on this task in an isolated git worktree.</DialogDescription>
        </DialogHeader>

        {task && (
          <div className="space-y-4">
            <TaskSummary name={task.name} projectName={projectName} agentName={agentName} priority={task.priority} />

            <RuntimeSelect
              runtimes={runtimes}
              isLoading={runtimesLoading}
              value={selectedRuntime}
              onChange={handleRuntimeChange}
            />

            {currentRuntime?.modelFlag && (
              <ModelSection
                runtime={currentRuntime}
                agentDefaultModel={agent?.defaultModel}
                selectedModel={selectedModel}
                customModelText={customModelText}
                providerModels={providerModels}
                providerModelsLoading={providerModelsLoading}
                onModelChange={handleModelChange}
                onCustomTextChange={setCustomModelText}
              />
            )}

            {task.estimate && ESTIMATE_MODEL_HINT[task.estimate] && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lightbulb className="h-3 w-3 shrink-0" />
                Task size <strong>{task.estimate}</strong> — {ESTIMATE_MODEL_HINT[task.estimate]} recommended
              </p>
            )}

            <BranchSelect
              branches={branches}
              isLoading={branchesLoading}
              value={selectedBranch}
              onChange={handleBranchChange}
              defaultLabel={defaultBranchLabel}
              newBranchName={newBranchName}
              onNewBranchNameChange={setNewBranchName}
              isCreating={createBranch.isPending}
              createError={createBranch.isError ? (createBranch.error as Error).message : undefined}
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                  <div>
                    <Label className="text-sm">Workflow Mode</Label>
                    <p className="text-xs text-muted-foreground">
                      Brainstorm → Plan → Execute with approval gates
                      {projectWorkflowMode !== 'off' && !workflowEnabled && ' (project default: on)'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={workflowEnabled}
                  onCheckedChange={setWorkflowEnabled}
                />
              </div>

              {workflowEnabled && (
                <div className="space-y-1.5 pl-1">
                  {providers.length > 0 ? (
                    <>
                      <Label className="text-xs">Workflow Provider</Label>
                      <Select value={workflowProviderId} onValueChange={setWorkflowProviderId}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          {providers.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name} — {p.modelName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Info className="h-3 w-3 shrink-0" />
                        Brainstorm & Plan use the API provider. Execute uses the CLI runtime.
                      </p>
                    </>
                  ) : (
                    <p className="flex items-center gap-1.5 text-xs text-amber-500">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      No API provider configured. Without one, the CLI will handle all stages.
                      Add a provider in Settings → Providers for structured brainstorm & plan output.
                    </p>
                  )}
                </div>
              )}
            </div>

            {startWork.isError && <p className="text-destructive text-sm">{(startWork.error as Error).message}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleStart}
                disabled={!selectedRuntime || isPending || isNewBranchInvalid}
              >
                {isPending ? 'Starting...' : 'Start Agent'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
