// React / library
import { ArrowLeft, Zap, FileText, Bot, FolderOpen, Trash2, Check, X, Pencil, Play } from 'lucide-react';
import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Components
import { IconPicker, resolveIcon } from '@/components/quick-actions/IconPicker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { ErrorState } from '@/components/error-state/ErrorState';
import { EditableCard } from '@/components/ui/editable-card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Hooks
import { useAgents } from '@/hooks/use-agents.hook';
import {
  useQuickAction,
  useUpdateQuickAction,
  useDeleteQuickAction,
  useRunQuickAction,
} from '@/hooks/use-quick-actions.hook';
import { useProjects } from '@/hooks/use-projects.hook';

// Context
import { useActiveProject } from '@/contexts/ProjectContext';

// Lib
import { timeAgo } from '@/lib/format';

const NONE = '__none__';

export function QuickActionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: quickAction, isLoading, isError, refetch } = useQuickAction(id);
  const { data: agents = [] } = useAgents();
  const { data: projects = [] } = useProjects();
  const updateQuickAction = useUpdateQuickAction();
  const deleteQuickAction = useDeleteQuickAction();
  const runQuickAction = useRunQuickAction();
  const { activeProjectId } = useActiveProject();

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);

  const startEditName = useCallback(() => {
    if (!quickAction) return;
    setNameDraft(quickAction.name);
    setEditingName(true);
  }, [quickAction]);

  const saveName = useCallback(() => {
    if (!quickAction || !nameDraft.trim()) return;
    updateQuickAction.mutate({ id: quickAction.id, data: { name: nameDraft.trim() } });
    setEditingName(false);
  }, [quickAction, nameDraft, updateQuickAction]);

  if (isError) {
    return <ErrorState message="Failed to load quick action." onRetry={refetch} />;
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading quick action...</p>
      </div>
    );
  }

  if (!quickAction) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <p className="text-muted-foreground text-sm">Quick action not found</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/quick-actions')}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Quick Actions
        </Button>
      </div>
    );
  }

  const handleDelete = () => {
    setDeleteOpen(true);
  };

  const handleRun = () => {
    const projectId = activeProjectId ?? quickAction.projectId;
    if (!projectId) return;
    runQuickAction.mutate({ id: quickAction.id, projectId });
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" className="w-fit" onClick={() => navigate('/quick-actions')}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Quick Actions
        </Button>
        <div className="flex items-center gap-2">
          {(activeProjectId || quickAction.projectId) && (
            <Button variant="default" size="sm" onClick={handleRun} disabled={runQuickAction.isPending}>
              <Play className="mr-1.5 h-3.5 w-3.5" />
              {runQuickAction.isPending ? 'Starting...' : 'Run'}
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
            const Icon = resolveIcon(quickAction.icon);
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
              <h1 className="text-2xl font-bold tracking-tight">{quickAction.name}</h1>
              <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Created {timeAgo(quickAction.createdAt)}</span>
            <span>·</span>
            <span>Updated {timeAgo(quickAction.updatedAt)}</span>
            {quickAction.icon && (
              <>
                <span>·</span>
                <Badge variant="outline" className="text-[10px]">
                  {quickAction.icon}
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
            value={quickAction.agentId ?? NONE}
            onValueChange={(v) =>
              updateQuickAction.mutate({ id: quickAction.id, data: { agentId: v === NONE ? null : v } })
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
            value={quickAction.projectId ?? NONE}
            onValueChange={(v) =>
              updateQuickAction.mutate({ id: quickAction.id, data: { projectId: v === NONE ? null : v } })
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
            value={quickAction.icon}
            onChange={(val) => updateQuickAction.mutate({ id: quickAction.id, data: { icon: val } })}
            className="h-8 text-xs"
          />
        </Card>
      </div>

      {/* Description */}
      <EditableCard
        icon={FileText}
        label="Description"
        value={quickAction.description}
        placeholder="Click to add a description..."
        isPending={updateQuickAction.isPending}
        onSave={(val) => updateQuickAction.mutate({ id: quickAction.id, data: { description: val } })}
      />

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete quick action"
        description="This will permanently delete the quick action. This action cannot be undone."
        isPending={deleteQuickAction.isPending}
        onConfirm={() => {
          deleteQuickAction.mutate(quickAction.id, { onSuccess: () => navigate('/quick-actions') });
        }}
      />

      {/* Prompt Template */}
      <EditableCard
        icon={Zap}
        label="Prompt Template"
        value={quickAction.promptTemplate}
        placeholder="Click to define the prompt sent to the agent..."
        isPending={updateQuickAction.isPending}
        onSave={(val) => {
          if (val) updateQuickAction.mutate({ id: quickAction.id, data: { promptTemplate: val } });
        }}
      />
    </div>
  );
}
