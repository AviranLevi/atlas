// React / library
import { ArrowLeft, Zap } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Components
import { IconPicker } from '@/components/automations/IconPicker';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

// Hooks
import { useAgents } from '@/hooks/use-agents.hook';
import { useProjects } from '@/hooks/use-projects.hook';
import { useCreateAutomation, useAutomationTemplates } from '@/hooks/use-automations.hook';

// Context
import { useActiveProject } from '@/contexts/ProjectContext';

// Types
import type { AutomationTemplate } from '@atlas/shared';

const NONE = '__none__';

export function AutomationNewPage() {
  const navigate = useNavigate();
  const { activeProjectId } = useActiveProject();
  const createAutomation = useCreateAutomation();
  const { data: agents = [] } = useAgents();
  const { data: projects = [] } = useProjects();
  const { data: templates = [] } = useAutomationTemplates();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [agentId, setAgentId] = useState<string>(NONE);
  const [promptTemplate, setPromptTemplate] = useState('');
  const [icon, setIcon] = useState('');
  const [projectId, setProjectId] = useState<string>(activeProjectId ?? NONE);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string | null>(null);

  const applyTemplate = (template: AutomationTemplate) => {
    setName(template.name);
    setDescription(template.description ?? '');
    setPromptTemplate(template.promptTemplate);
    setIcon(template.icon ?? '');
    setSelectedTemplateKey(template.key);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    createAutomation.mutate(
      {
        name,
        promptTemplate,
        description: description || null,
        agentId: agentId === NONE ? null : agentId,
        icon: icon || null,
        projectId: projectId === NONE ? null : projectId,
      },
      {
        onSuccess: (created) => navigate(`/automations/${created.id}`),
      },
    );
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Navigation */}
      <Button variant="ghost" size="sm" className="w-fit" onClick={() => navigate('/automations')}>
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        Back to Automations
      </Button>

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="bg-primary/10 mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
          <Zap className="text-primary h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Automation</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create a reusable workflow that runs with one click.</p>
        </div>
      </div>

      {/* Templates */}
      {templates.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Start from a template</Label>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((t) => (
              <Card
                key={t.key}
                className={`cursor-pointer p-3 transition-colors hover:bg-muted/50 ${
                  selectedTemplateKey === t.key ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => applyTemplate(t)}
              >
                <p className="text-sm font-medium">{t.name}</p>
                {t.description && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{t.description}</p>}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 space-y-5">
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
            <Label htmlFor="auto-prompt">Prompt Template</Label>
            <Textarea
              id="auto-prompt"
              value={promptTemplate}
              onChange={(e) => setPromptTemplate(e.target.value)}
              placeholder="The instruction sent to the agent when this automation runs..."
              rows={6}
              className="min-h-[120px] resize-y font-mono text-sm"
              required
            />
            <p className="text-[11px] text-muted-foreground">
              This is the prompt that will be sent to the agent. Be specific about what the agent should do.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="auto-agent">Agent</Label>
              <Select value={agentId} onValueChange={setAgentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None (use default)</SelectItem>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            <div className="space-y-2">
              <Label>Icon</Label>
              <IconPicker value={icon || null} onChange={(val) => setIcon(val ?? '')} />
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/automations')}>
            Cancel
          </Button>
          <Button type="submit" disabled={createAutomation.isPending || !name.trim() || !promptTemplate.trim()}>
            {createAutomation.isPending ? 'Creating...' : 'Create Automation'}
          </Button>
        </div>

        {createAutomation.error && (
          <p className="text-sm text-destructive">{(createAutomation.error as Error).message}</p>
        )}
      </form>
    </div>
  );
}
