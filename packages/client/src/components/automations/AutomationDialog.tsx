// React / library
import { useState, useEffect } from 'react';

// Components
import { IconPicker } from '@/components/automations/IconPicker';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

// Hooks
import { useAgents } from '@/hooks/use-agents.hook';
import { useProjects } from '@/hooks/use-projects.hook';
import { useCreateAutomation, useUpdateAutomation, useAutomationTemplates } from '@/hooks/use-automations.hook';

// Types
import type { Automation, AutomationTemplate } from '@atlas/shared';

const NONE = '__none__';

type AutomationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  automation?: Automation;
  defaultProjectId?: string;
  onSaved?: (automation: Automation) => void;
};

export function AutomationDialog({ open, onOpenChange, automation, defaultProjectId, onSaved }: AutomationDialogProps) {
  const createAutomation = useCreateAutomation();
  const updateAutomation = useUpdateAutomation();
  const { data: agents = [] } = useAgents();
  const { data: projects = [] } = useProjects();
  const { data: templates = [] } = useAutomationTemplates();

  const isEditing = !!automation;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [agentId, setAgentId] = useState<string>(NONE);
  const [promptTemplate, setPromptTemplate] = useState('');
  const [icon, setIcon] = useState('');
  const [projectId, setProjectId] = useState<string>(NONE);

  useEffect(() => {
    if (open) {
      if (automation) {
        setName(automation.name);
        setDescription(automation.description ?? '');
        setAgentId(automation.agentId ?? NONE);
        setPromptTemplate(automation.promptTemplate);
        setIcon(automation.icon ?? '');
        setProjectId(automation.projectId ?? NONE);
      } else {
        setName('');
        setDescription('');
        setAgentId(NONE);
        setPromptTemplate('');
        setIcon('');
        setProjectId(defaultProjectId ?? NONE);
      }
    }
  }, [open, automation, defaultProjectId]);

  const applyTemplate = (template: AutomationTemplate) => {
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
      updateAutomation.mutate(
        { id: automation.id, data },
        {
          onSuccess: (updated: Automation) => {
            onOpenChange(false);
            onSaved?.(updated);
          },
        },
      );
    } else {
      createAutomation.mutate(data, {
        onSuccess: (created: Automation) => {
          onOpenChange(false);
          onSaved?.(created);
        },
      });
    }
  };

  const isPending = createAutomation.isPending || updateAutomation.isPending;
  const error = createAutomation.error || updateAutomation.error;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Automation' : 'New Automation'}</DialogTitle>
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
            <Label htmlFor="auto-name">Name</Label>
            <Input
              id="auto-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Commit & Push"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="auto-desc">Description</Label>
            <Input
              id="auto-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional short description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="auto-agent">Agent</Label>
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
            <Label htmlFor="auto-prompt">Prompt Template</Label>
            <Textarea
              id="auto-prompt"
              value={promptTemplate}
              onChange={(e) => setPromptTemplate(e.target.value)}
              placeholder="The instruction sent to the agent when this automation runs..."
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
              <Label htmlFor="auto-scope">Scope</Label>
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
              {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Automation'}
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}
        </form>
      </DialogContent>
    </Dialog>
  );
}
