// React / library
import { RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

// Components
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ModelSection } from './ModelSection';
import { RuntimeSelect } from './RuntimeSelect';

// Hooks
import { useProviderModels } from '@/hooks/use-agent-providers.hook';
import { useAgent } from '@/hooks/use-agents.hook';
import { useAgentRuntimes, useRerunWorkspace } from '@/hooks/use-workspaces.hook';

// Types
import type { RerunDialogProps } from './workspaces.types';

// Constants
import { CUSTOM_MODEL_VALUE, DEFAULT_MODEL_VALUE, getModelStorageKey } from './workspaces.constants';

/** Dialog for re-running a workspace with a (possibly different) runtime and model. */
export function RerunDialog({ open, onOpenChange, workspace, onSuccess }: RerunDialogProps) {
  const { data: runtimes = [], isLoading: runtimesLoading } = useAgentRuntimes();
  const rerun = useRerunWorkspace();

  const [selectedRuntime, setSelectedRuntime] = useState<string>(workspace.agentRuntime);
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL_VALUE);
  const [customModelText, setCustomModelText] = useState<string>('');

  const currentRuntime = useMemo(() => runtimes.find((r) => r.id === selectedRuntime), [runtimes, selectedRuntime]);

  const agentId = workspace.agentId ?? undefined;
  const { data: agent } = useAgent(agentId);
  const { data: providerModels = [], isLoading: providerModelsLoading } = useProviderModels(
    agent?.providerId ?? undefined,
  );

  // Sync model selection: prioritize workspace values on open, fall back to localStorage on runtime change
  const prevRuntimeRef = useRef(selectedRuntime);
  useEffect(() => {
    if (!open) return;

    const runtimeChanged = prevRuntimeRef.current !== selectedRuntime;
    prevRuntimeRef.current = selectedRuntime;

    if (!runtimeChanged) {
      // Dialog just opened -- use workspace's saved model
      setSelectedRuntime(workspace.agentRuntime);
      setSelectedModel(workspace.model ?? DEFAULT_MODEL_VALUE);
    } else {
      // User manually changed runtime -- fall back to localStorage
      const saved = localStorage.getItem(getModelStorageKey(selectedRuntime));
      setSelectedModel(saved ?? DEFAULT_MODEL_VALUE);
    }
    setCustomModelText('');
  }, [open, selectedRuntime, workspace.agentRuntime, workspace.model]);

  const handleRuntimeChange = (value: string) => {
    setSelectedRuntime(value);
  };

  const handleModelChange = (value: string) => {
    setSelectedModel(value);
    if (value !== DEFAULT_MODEL_VALUE && value !== CUSTOM_MODEL_VALUE) {
      localStorage.setItem(getModelStorageKey(selectedRuntime), value);
    }
    if (value !== CUSTOM_MODEL_VALUE) setCustomModelText('');
  };

  const handleRerun = () => {
    if (!selectedRuntime) return;

    let model: string | undefined;
    if (selectedModel === CUSTOM_MODEL_VALUE && customModelText.trim()) {
      model = customModelText.trim();
    } else if (selectedModel !== DEFAULT_MODEL_VALUE && selectedModel !== CUSTOM_MODEL_VALUE) {
      model = selectedModel;
    }

    rerun.mutate(
      { workspaceId: workspace.id, agentRuntimeId: selectedRuntime, model },
      {
        onSuccess: (newWorkspace) => {
          onOpenChange(false);
          onSuccess?.(newWorkspace);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Re-run Workspace
          </DialogTitle>
          <DialogDescription>
            Choose the runtime and model for the new run. The same task and branch will be used.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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

          {rerun.isError && <p className="text-destructive text-sm">{(rerun.error as Error).message}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleRerun} disabled={!selectedRuntime || rerun.isPending}>
              {rerun.isPending ? 'Starting...' : 'Re-run'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
