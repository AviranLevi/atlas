// React / library
import { useState, useEffect, useMemo, type ReactElement } from 'react';
import { Play, Lightbulb } from 'lucide-react';

// Components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ModelSection } from './ModelSection';
import { TaskSummary } from './TaskSummary';
import { RuntimeSelect } from './RuntimeSelect';
import { BranchSelect } from './BranchSelect';

// Hooks
import { useAgentRuntimes, useStartWork } from '@/hooks/use-workspaces.hook';
import { useProjectBranches, useProject, useCreateBranch } from '@/hooks/use-projects.hook';
import { useAgent } from '@/hooks/use-agents.hook';
import { useProviderModels } from '@/hooks/use-agent-providers.hook';

// Types
import type { ModelPreset } from '@atlas/shared';
import type { StartWorkDialogProps } from './workspaces.types';

// Constants
import {
  RUNTIME_STORAGE_KEY,
  DEFAULT_BRANCH_VALUE,
  NEW_BRANCH_VALUE,
  DEFAULT_MODEL_VALUE,
  CUSTOM_MODEL_VALUE,
  ESTIMATE_MODEL_HINT,
  getModelStorageKey,
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
  const { data: providerModels = [], isLoading: providerModelsLoading } = useProviderModels(agent?.providerId ?? undefined);
  const startWork = useStartWork();
  const createBranch = useCreateBranch(projectId);

  const [selectedRuntime, setSelectedRuntime] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>(DEFAULT_BRANCH_VALUE);
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL_VALUE);
  const [customModelText, setCustomModelText] = useState<string>('');
  const [newBranchName, setNewBranchName] = useState<string>('');

  const currentRuntime = useMemo(
    () => runtimes.find((r) => r.id === selectedRuntime),
    [runtimes, selectedRuntime],
  );

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
  }, [open]);

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
        providerId: agent?.providerId ?? undefined,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  const handleStart = () => {
    if (selectedBranch === NEW_BRANCH_VALUE && newBranchName.trim()) {
      createBranch.mutate(
        { name: newBranchName.trim() },
        { onSuccess: (data) => doStartWork(data.branch) },
      );
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
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Start Work
          </DialogTitle>
          <DialogDescription>
            Spawn an agent to work on this task in an isolated git worktree.
          </DialogDescription>
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

            {startWork.isError && (
              <p className="text-destructive text-sm">
                {(startWork.error as Error).message}
              </p>
            )}

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
