import { useEffect, useState } from 'react';
import type { Agent } from '@my-agents/shared';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateAgent, useUpdateAgent } from '@/hooks/use-agents.hook';

type AgentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent?: Agent;
};

export function AgentDialog({ open, onOpenChange, agent }: AgentDialogProps) {
  const createAgent = useCreateAgent();
  const updateAgent = useUpdateAgent();
  const isEditing = !!agent;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [personality, setPersonality] = useState('');
  const [unbreakableRules, setUnbreakableRules] = useState('');

  useEffect(() => {
    if (agent) {
      setName(agent.name);
      setDescription(agent.description ?? '');
      setPersonality(agent.personality ?? '');
      setUnbreakableRules(agent.unbreakableRules ?? '');
    } else {
      setName('');
      setDescription('');
      setPersonality('');
      setUnbreakableRules('');
    }
  }, [agent, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name,
      description: description || null,
      personality: personality || null,
      unbreakableRules: unbreakableRules || null,
    };

    if (isEditing) {
      updateAgent.mutate(
        { id: agent.id, data },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createAgent.mutate(data, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  const isPending = createAgent.isPending || updateAgent.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
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
          <div className="space-y-2">
            <Label htmlFor="personality">Personality</Label>
            <Textarea
              id="personality"
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              placeholder="How this agent should behave and communicate..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rules">Unbreakable Rules</Label>
            <Textarea
              id="rules"
              value={unbreakableRules}
              onChange={(e) => setUnbreakableRules(e.target.value)}
              placeholder="Rules this agent must never break..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Agent'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
