// React / library
import { useState } from 'react';

// Components
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Types
import type { ExecutorStatus } from '@atlas/shared';

type StartPipelineDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  runtimes: ExecutorStatus[];
  title: string;
  description: string;
  isPending: boolean;
  onConfirm: (agentRuntimeId: string) => void;
};

export function StartPipelineDialog({
  open,
  onOpenChange,
  runtimes,
  title,
  description,
  isPending,
  onConfirm,
}: StartPipelineDialogProps) {
  const installedRuntimes = runtimes.filter((r) => r.installed && r.authenticated);
  const [runtimeId, setRuntimeId] = useState(installedRuntimes[0]?.id ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!runtimeId) return;
    onConfirm(runtimeId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">{description}</p>

          <div className="flex flex-col gap-1.5">
            <Label>Agent Runtime</Label>
            <Select value={runtimeId} onValueChange={setRuntimeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select runtime" />
              </SelectTrigger>
              <SelectContent>
                {installedRuntimes.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !runtimeId}>
              {isPending ? 'Starting...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
