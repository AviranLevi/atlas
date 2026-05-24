// React / library
import { useState, useEffect } from 'react';

// Components
import { IconPicker } from '@/components/quick-actions/IconPicker';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

// Hooks
import { useAgents } from '@/hooks/use-agents.hook';
import { useProjects } from '@/hooks/use-projects.hook';
import { useCreateQuickAction, useUpdateQuickAction, useQuickActionTemplates } from '@/hooks/use-quick-actions.hook';

// Types
import type { QuickAction, QuickActionTemplate } from '@atlas/shared';

const NONE = '__none__';

type QuickActionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quickAction?: QuickAction;
  defaultProjectId?: string;
  onSaved?: (quickAction: QuickAction) => void;
};

export function QuickActionDialog({
  open,
  onOpenChange,
  quickAction,
  defaultProjectId,
  onSaved,
}: QuickActionDialogProps) {
  const createQuickAction = useCreateQuickAction();
  const updateQuickAction = useUpdateQuickAction();
  const { data: agents = [] } = useAgents();
  const { data: projects = [] } = useProjects();
  const { data: templates = [] } = useQuickActionTemplates();

  const isEditing = !!quickAction;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [agentId, setAgentId] = useState<string>(NONE);
  const [promptTemplate, setPromptTemplate] = useState('');
  const [icon, setIcon] = useState('');
  const [projectId, setProjectId] = useState<string>(NONE);

  useEffect(() => {
    if (open) {
      if (quickAction) {
        setName(quickAction.name);
        setDescription(quickAction.description ?? '');
        setAgentId(quickAction.agentId ?? NONE);
        setPromptTemplate(quickAction.promptTemplate);
        setIcon(quickAction.icon ?? '');
        setProjectId(quickAction.projectId ?? NONE);
      } else {
        setName('');
        setDescription('');
        setAgentId(NONE);
        setPromptTemplate('');
        setIcon('');
        setProjectId(defaultProjectId ?? NONE);
      }
    }
  }, [open, quickAction, defaultProjectId]);

  const applyTemplate = (template: QuickActionTemplate) => {
    setName(template.name);
    setDescription(template.description ?? '');
    setPromptTemplate(template.promptTemplate);
    setIcon(template.icon ?? '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      name,
      promptTemplate,
      description: description || null,
      agentId: agentId === NONE ? null : agentId,
      icon: icon || null,
      projectId: projectId === NONE ? null : projectId,
    };

    if (isEditing) {
      updateQuickAction.mutate(
        { id: quickAction.id, data },
        {
          onSuccess: (updated: QuickAction) => {
            onOpenChange(false);
            onSaved?.(updated);
          },
        },
      );
    } else {
      createQuickAction.mutate(data, {
        onSuccess: (created: QuickAction) => {
          onOpenChange(false);
          onSaved?.(created);
        },
      });
    }
  };

  const isPending = createQuickAction.isPending || updateQuickAction.isPending;
  const error = createQuickAction.error || updateQuickAction.error;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Quick Action' : 'New Quick Action'}</DialogTitle>
        </DialogHeader>

        {!isEditing && templates.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Start from a template</Label>
            <div className="flex flex-wrap gap-1.5">
              {templates.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className="rounded-md border px-2.5 py-1 text-xs hover:bg-muted transition-colors"
                  onClick={() => applyTemplate(t)}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="qa-name">Name</Label>
            <Input
              id="qa-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Commit & Push"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="qa-desc">Description</Label>
            <Input
              id="qa-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional short description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="qa-agent">Agent</Label>
            <Select value={agentId} onValueChange={setAgentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>None</SelectItem>
                {agents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="qa-prompt">Prompt Template</Label>
            <Textarea
              id="qa-prompt"
              value={promptTemplate}
              onChange={(e) => setPromptTemplate(e.target.value)}
              placeholder="The instruction sent to the agent when this quick action runs..."
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Icon</Label>
              <IconPicker value={icon || null} onChange={(val) => setIcon(val ?? '')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qa-scope">Scope</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Global (all projects)</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name.trim() || !promptTemplate.trim()}>
              {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Quick Action'}
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}
        </form>
      </DialogContent>
    </Dialog>
  );
}
