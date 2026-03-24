// React / library
import { useState, useEffect, useMemo } from 'react';
import { Play, GitBranch, Cpu } from 'lucide-react';

// Components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Hooks
import { useAgentRuntimes, useStartWork } from '@/hooks/use-workspaces.hook';
import { useProjectBranches, useProject } from '@/hooks/use-projects.hook';
import { useAgent } from '@/hooks/use-agents.hook';

// Types
import type { StartWorkDialogProps } from './workspaces.types';
import type { ExecutorStatus } from '@my-agents/shared';

// Constants
import {
  RUNTIME_STORAGE_KEY,
  MODEL_STORAGE_KEY,
  DEFAULT_BRANCH_VALUE,
  DEFAULT_MODEL_VALUE,
  CUSTOM_MODEL_VALUE,
} from './workspaces.constants';

function getModelStorageKey(runtimeId: string): string {
  return `${MODEL_STORAGE_KEY}:${runtimeId}`;
}

function ModelSection({
  runtime,
  agentDefaultModel,
  selectedModel,
  customModelText,
  onModelChange,
  onCustomTextChange,
}: {
  runtime: ExecutorStatus;
  agentDefaultModel: string | null | undefined;
  selectedModel: string;
  customModelText: string;
  onModelChange: (value: string) => void;
  onCustomTextChange: (value: string) => void;
}) {
  if (!runtime.modelFlag) return null;

  const presets = runtime.modelPresets ?? [];
  const supportsCustom = runtime.supportsCustomModel !== false;
  const hasPresets = presets.length > 0;

  if (!hasPresets && supportsCustom) {
    return (
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5">
          <Cpu className="h-3.5 w-3.5" />
          Model
        </Label>
        <Input
          placeholder={runtime.defaultModel ?? 'Enter model name...'}
          value={customModelText}
          onChange={(e) => onCustomTextChange(e.target.value)}
        />
        {agentDefaultModel && (
          <p className="text-muted-foreground text-xs">
            Agent default: {agentDefaultModel}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5">
        <Cpu className="h-3.5 w-3.5" />
        Model
      </Label>
      <Select value={selectedModel} onValueChange={onModelChange}>
        <SelectTrigger>
          <SelectValue placeholder="Default model" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={DEFAULT_MODEL_VALUE}>
            <span className="text-muted-foreground">
              Default{runtime.defaultModel ? ` (${runtime.defaultModel})` : ''}
            </span>
          </SelectItem>
          {presets.map((preset) => (
            <SelectItem key={preset.value} value={preset.value}>
              {preset.label}
            </SelectItem>
          ))}
          {supportsCustom && (
            <SelectItem value={CUSTOM_MODEL_VALUE}>
              Custom...
            </SelectItem>
          )}
        </SelectContent>
      </Select>
      {selectedModel === CUSTOM_MODEL_VALUE && (
        <Input
          placeholder="Enter model name..."
          value={customModelText}
          onChange={(e) => onCustomTextChange(e.target.value)}
          autoFocus
        />
      )}
      {agentDefaultModel && (
        <p className="text-muted-foreground text-xs">
          Agent default: {agentDefaultModel}
        </p>
      )}
    </div>
  );
}

export function StartWorkDialog({
  open,
  onOpenChange,
  task,
  agentName,
  projectName,
  projectId,
}: StartWorkDialogProps) {
  const { data: runtimes = [], isLoading: runtimesLoading } = useAgentRuntimes();
  const { data: branches = [], isLoading: branchesLoading } = useProjectBranches(projectId);
  const { data: project } = useProject(projectId);
  const { data: agent } = useAgent(task?.agentId ?? undefined);
  const startWork = useStartWork();

  const [selectedRuntime, setSelectedRuntime] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>(DEFAULT_BRANCH_VALUE);
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL_VALUE);
  const [customModelText, setCustomModelText] = useState<string>('');

  const currentRuntime = useMemo(
    () => runtimes.find((r) => r.id === selectedRuntime),
    [runtimes, selectedRuntime],
  );

  // Restore last used runtime when runtimes are loaded
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

  // When runtime changes, restore last used model for that runtime
  useEffect(() => {
    if (!selectedRuntime) return;
    const savedModel = localStorage.getItem(getModelStorageKey(selectedRuntime));
    if (savedModel) {
      setSelectedModel(savedModel);
      setCustomModelText('');
    } else if (agent?.defaultModel) {
      setSelectedModel(agent.defaultModel);
      setCustomModelText('');
    } else {
      setSelectedModel(DEFAULT_MODEL_VALUE);
      setCustomModelText('');
    }
  }, [selectedRuntime, agent?.defaultModel]);

  // Reset branch selection when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedBranch(DEFAULT_BRANCH_VALUE);
    }
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
    if (value !== CUSTOM_MODEL_VALUE) {
      setCustomModelText('');
    }
  };

  const handleStart = () => {
    if (!task || !selectedRuntime) return;
    const baseBranch = selectedBranch !== DEFAULT_BRANCH_VALUE ? selectedBranch : undefined;

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
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      },
    );
  };

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
            <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
              <p className="font-medium text-sm">{task.name}</p>
              {projectName && (
                <p className="text-muted-foreground text-xs">Project: {projectName}</p>
              )}
              {agentName && (
                <p className="text-muted-foreground text-xs">Agent: {agentName}</p>
              )}
              {task.priority && (
                <p className="text-muted-foreground text-xs">Priority: {task.priority}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Agent Runtime</Label>
              {runtimesLoading ? (
                <p className="text-muted-foreground text-sm">Loading runtimes...</p>
              ) : (
                <Select value={selectedRuntime} onValueChange={handleRuntimeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a runtime..." />
                  </SelectTrigger>
                  <SelectContent>
                    {runtimes
                      .sort((a, b) => {
                        const score = (r: typeof a) =>
                          r.installed && r.authenticated ? 2 : r.installed ? 1 : 0;
                        return score(b) - score(a);
                      })
                      .map((rt) => (
                        <SelectItem
                          key={rt.id}
                          value={rt.id}
                          disabled={!rt.installed || !rt.authenticated}
                        >
                          <div className="flex items-center gap-2">
                            <span>{rt.name}</span>
                            {!rt.installed && (
                              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                Not installed
                              </Badge>
                            )}
                            {rt.installed && !rt.authenticated && (
                              <Badge variant="outline" className="text-[10px] border-yellow-300 text-yellow-600 dark:border-yellow-700 dark:text-yellow-400">
                                {rt.authHint ?? 'Not authenticated'}
                              </Badge>
                            )}
                            {rt.mcpConfigFormat !== 'none' && rt.installed && rt.authenticated && (
                              <Badge variant="secondary" className="text-[10px]">
                                MCP
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {currentRuntime?.modelFlag && (
              <ModelSection
                runtime={currentRuntime}
                agentDefaultModel={agent?.defaultModel}
                selectedModel={selectedModel}
                customModelText={customModelText}
                onModelChange={handleModelChange}
                onCustomTextChange={setCustomModelText}
              />
            )}

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <GitBranch className="h-3.5 w-3.5" />
                Base Branch
              </Label>
              {branchesLoading ? (
                <p className="text-muted-foreground text-sm">Loading branches...</p>
              ) : (
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={DEFAULT_BRANCH_VALUE}>
                      <span className="text-muted-foreground">
                        Default ({defaultBranchLabel})
                      </span>
                    </SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch} value={branch}>
                        {branch}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className="text-muted-foreground text-xs">
                The worktree will branch off from this base.
              </p>
            </div>

            {startWork.isError && (
              <p className="text-destructive text-sm">
                {(startWork.error as Error).message}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" asChild>
                <button type="button" onClick={() => onOpenChange(false)}>
                  Cancel
                </button>
              </Button>
              <Button asChild>
                <button
                  type="button"
                  onClick={handleStart}
                  disabled={!selectedRuntime || startWork.isPending}
                >
                  {startWork.isPending ? 'Starting...' : 'Start Agent'}
                </button>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
