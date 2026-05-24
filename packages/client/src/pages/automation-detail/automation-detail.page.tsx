// React / library
import { ArrowLeft, Zap, FileText, Bot, FolderOpen, Trash2, Check, X, Pencil, Play } from 'lucide-react';
import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Components
import { IconPicker, resolveIcon } from '@/components/automations/IconPicker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EditableCard } from '@/components/ui/editable-card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Hooks
import { useAgents } from '@/hooks/use-agents.hook';
import {
  useAutomation,
  useUpdateAutomation,
  useDeleteAutomation,
  useRunAutomation,
} from '@/hooks/use-automations.hook';
import { useProjects } from '@/hooks/use-projects.hook';

// Context
import { useActiveProject } from '@/contexts/ProjectContext';

// Lib
import { timeAgo } from '@/lib/format';

const NONE = '__none__';

export function AutomationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: automation, isLoading } = useAutomation(id);
  const { data: agents = [] } = useAgents();
  const { data: projects = [] } = useProjects();
  const updateAutomation = useUpdateAutomation();
  const deleteAutomation = useDeleteAutomation();
  const runAutomation = useRunAutomation();
  const { activeProjectId } = useActiveProject();

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  const startEditName = useCallback(() => {
    if (!automation) return;
    setNameDraft(automation.name);
    setEditingName(true);
  }, [automation]);

  const saveName = useCallback(() => {
    if (!automation || !nameDraft.trim()) return;
    updateAutomation.mutate({ id: automation.id, data: { name: nameDraft.trim() } });
    setEditingName(false);
  }, [automation, nameDraft, updateAutomation]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading automation...</p>
      </div>
    );
  }

  if (!automation) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <p className="text-muted-foreground text-sm">Automation not found</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/automations')}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Automations
        </Button>
      </div>
    );
  }

  const handleDelete = () => {
    if (confirm('Delete this automation? This cannot be undone.')) {
      deleteAutomation.mutate(automation.id, { onSuccess: () => navigate('/automations') });
    }
  };

  const handleRun = () => {
    const projectId = activeProjectId ?? automation.projectId;
    if (!projectId) return;
    runAutomation.mutate({ id: automation.id, projectId });
  };

  const agentName = automation.agentId ? agents.find((a) => a.id === automation.agentId)?.name : null;
  const projectName = automation.projectId ? projects.find((p) => p.id === automation.projectId)?.name : null;

  return (
    <div className="flex flex-col gap-8">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" className="w-fit" onClick={() => navigate('/automations')}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Automations
        </Button>
        <div className="flex items-center gap-2">
          {(activeProjectId || automation.projectId) && (
            <Button variant="default" size="sm" onClick={handleRun} disabled={runAutomation.isPending}>
              <Play className="mr-1.5 h-3.5 w-3.5" />
              {runAutomation.isPending ? 'Starting...' : 'Run'}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Header with inline-editable name */}
      <div className="flex items-start gap-3">
        <div className="bg-primary/10 mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
          {(() => {
            const Icon = resolveIcon(automation.icon);
            return <Icon className="text-primary h-5 w-5" />;
          })()}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          {editingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                className="h-9 text-xl font-bold"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveName();
                  if (e.key === 'Escape') setEditingName(false);
                }}
              />
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={saveName}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingName(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <button
              type="button"
              className="group flex items-center gap-2 rounded-md transition-colors hover:bg-muted/50 px-1 -mx-1"
              onClick={startEditName}
            >
              <h1 className="text-2xl font-bold tracking-tight">{automation.name}</h1>
              <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Created {timeAgo(automation.createdAt)}</span>
            <span>·</span>
            <span>Updated {timeAgo(automation.updatedAt)}</span>
            {automation.icon && (
              <>
                <span>·</span>
                <Badge variant="outline" className="text-[10px]">
                  {automation.icon}
                </Badge>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Metadata row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Bot className="h-3.5 w-3.5" />
            Agent
          </span>
          <Select
            value={automation.agentId ?? NONE}
            onValueChange={(v) =>
              updateAutomation.mutate({ id: automation.id, data: { agentId: v === NONE ? null : v } })
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
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
        </Card>

        <Card className="p-4">
          <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <FolderOpen className="h-3.5 w-3.5" />
            Scope
          </span>
          <Select
            value={automation.projectId ?? NONE}
            onValueChange={(v) =>
              updateAutomation.mutate({ id: automation.id, data: { projectId: v === NONE ? null : v } })
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
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
        </Card>

        <Card className="p-4">
          <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Zap className="h-3.5 w-3.5" />
            Icon
          </span>
          <IconPicker
            value={automation.icon}
            onChange={(val) => updateAutomation.mutate({ id: automation.id, data: { icon: val } })}
            className="h-8 text-xs"
          />
        </Card>
      </div>

      {/* Description */}
      <EditableCard
        icon={FileText}
        label="Description"
        value={automation.description}
        placeholder="Click to add a description..."
        isPending={updateAutomation.isPending}
        onSave={(val) => updateAutomation.mutate({ id: automation.id, data: { description: val } })}
      />

      {/* Prompt Template */}
      <EditableCard
        icon={Zap}
        label="Prompt Template"
        value={automation.promptTemplate}
        placeholder="Click to define the prompt sent to the agent..."
        isPending={updateAutomation.isPending}
        onSave={(val) => {
          if (val) updateAutomation.mutate({ id: automation.id, data: { promptTemplate: val } });
        }}
      />
    </div>
  );
}
