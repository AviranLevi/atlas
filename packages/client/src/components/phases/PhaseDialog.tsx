// React / library
import { useEffect, useState } from 'react';

// Components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Hooks
import { useCreatePhase, useUpdatePhase } from '@/hooks/use-phases.hook';

// Types
import type { PhaseStatus } from '@my-agents/shared';
import type { PhaseDialogProps } from './phases.types';

// Constants
import { STATUS_LABELS } from './phases.constants';

export function PhaseDialog({ open, onOpenChange, projectId, phase }: PhaseDialogProps) {
  const createPhase = useCreatePhase();
  const updatePhase = useUpdatePhase();
  const isEditing = !!phase;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<PhaseStatus>('planning');

  useEffect(() => {
    if (phase) {
      setName(phase.name);
      setDescription(phase.description ?? '');
      setStatus(phase.status as PhaseStatus);
    } else {
      setName('');
      setDescription('');
      setStatus('planning');
    }
  }, [phase, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name,
      description: description || null,
      status,
    };
    if (isEditing) {
      updatePhase.mutate(
        { id: phase.id, data },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createPhase.mutate(
        { projectId, orderIndex: 0, ...data },
        { onSuccess: () => onOpenChange(false) }
      );
    }
  };

  const isPending = createPhase.isPending || updatePhase.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Phase' : 'New Phase'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phase-name">Name</Label>
            <Input
              id="phase-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Phase 1: MVP"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phase-description">Description</Label>
            <Textarea
              id="phase-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Goals and scope for this phase..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as PhaseStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(STATUS_LABELS) as [PhaseStatus, string][]).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Phase'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
