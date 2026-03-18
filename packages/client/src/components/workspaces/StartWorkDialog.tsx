// React / library
import { useState } from 'react';
import { Play } from 'lucide-react';
// Components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
// Types
import type { Task } from '@my-agents/shared';

type StartWorkDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  agentName?: string;
  projectName?: string;
};

export function StartWorkDialog({
  open,
  onOpenChange,
  task,
  agentName,
  projectName,
}: StartWorkDialogProps) {
  const { data: runtimes = [], isLoading: runtimesLoading } = useAgentRuntimes();
  const startWork = useStartWork();
  const [selectedRuntime, setSelectedRuntime] = useState<string>('');

  const handleStart = () => {
    if (!task || !selectedRuntime) return;
    startWork.mutate(
      { taskId: task.id, agentRuntimeId: selectedRuntime },
      {
        onSuccess: () => {
          onOpenChange(false);
          setSelectedRuntime('');
        },
      },
    );
  };

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
                <Select value={selectedRuntime} onValueChange={setSelectedRuntime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a runtime..." />
                  </SelectTrigger>
                  <SelectContent>
                    {runtimes.map((rt) => (
                      <SelectItem key={rt.id} value={rt.id}>
                        {rt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
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
