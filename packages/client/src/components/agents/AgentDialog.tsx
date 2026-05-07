// React / library
import { useEffect, useState } from 'react';

// Components
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Hooks
import { useAgentProviders } from '@/hooks/use-agent-providers.hook';
import { useCreateAgent, useUpdateAgent } from '@/hooks/use-agents.hook';

// Types
import type { AgentDialogProps } from './agents.types';

// Constants
import { NONE } from './agents.constants';

export function AgentDialog({ open, onOpenChange, agent, onCreated }: AgentDialogProps) {
  const createAgent = useCreateAgent();
  const updateAgent = useUpdateAgent();
  const { data: providers = [] } = useAgentProviders();
  const isEditing = !!agent;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [providerId, setProviderId] = useState<string>(NONE);

  useEffect(() => {
    if (agent) {
      setName(agent.name);
      setDescription(agent.description ?? '');
      setProviderId(agent.providerId ?? NONE);
    } else {
      setName('');
      setDescription('');
      setProviderId(NONE);
    }
  }, [agent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name,
      description: description || null,
      providerId: providerId === NONE ? null : providerId,
    };

    if (isEditing) {
      updateAgent.mutate({ id: agent.id, data }, { onSuccess: () => onOpenChange(false) });
    } else {
      createAgent.mutate(
        { ...data, personality: null, unbreakableRules: null, defaultModel: null, defaultRuntimeId: null },
        {
          onSuccess: (created) => {
            if (onCreated) onCreated(created);
            else onOpenChange(false);
          },
        },
      );
    }
  };

  const isPending = createAgent.isPending || updateAgent.isPending;
  const submitMutation = isEditing ? updateAgent : createAgent;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Agent' : 'New Agent'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., NestJS Backend Agent"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this agent's role"
            />
          </div>
          {providers.length > 0 && (
            <div className="space-y-2">
              <Label>AI Provider</Label>
              <Select value={providerId} onValueChange={setProviderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {providers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Agent'}
            </Button>
            {submitMutation.isError && (
              <p className="text-sm text-destructive">{(submitMutation.error as Error).message}</p>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
