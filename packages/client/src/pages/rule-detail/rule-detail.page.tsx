// React / library
import { ArrowLeft, ScrollText, FileText, Bot, Trash2, Check, X, Pencil, FolderOpen, Download } from 'lucide-react';
import { useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

// Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { EditableCard } from '@/components/ui/editable-card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Hooks
import { useProjects } from '@/hooks/use-projects.hook';
import { useRuleDetail } from '@/hooks/use-rules.hook';
import { useUpdateRule, useDeleteRule } from '@/hooks/use-rules.hook';
import { useExportRulePackage } from '@/hooks/use-packages.hook';

// Lib
import { timeAgo } from '@/lib/format';

// Constants
import { RULE_TYPES, NONE } from '@/components/rules/rules.constants';

export function RuleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: detail, isLoading } = useRuleDetail(id);
  const { data: projects = [] } = useProjects();
  const updateRule = useUpdateRule();
  const deleteRule = useDeleteRule();
  const exportRule = useExportRulePackage();

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [editingTags, setEditingTags] = useState(false);
  const [tagsDraft, setTagsDraft] = useState('');

  const startEditName = useCallback(() => {
    if (!detail) return;
    setNameDraft(detail.rule.name);
    setEditingName(true);
  }, [detail]);

  const saveName = useCallback(() => {
    if (!detail || !nameDraft.trim()) return;
    updateRule.mutate({ id: detail.rule.id, data: { name: nameDraft.trim() } });
    setEditingName(false);
  }, [detail, nameDraft, updateRule]);

  const startEditTags = useCallback(() => {
    if (!detail) return;
    setTagsDraft(detail.rule.tags.join(', '));
    setEditingTags(true);
  }, [detail]);

  const saveTags = useCallback(() => {
    if (!detail) return;
    const tags = tagsDraft
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    updateRule.mutate({ id: detail.rule.id, data: { tags } });
    setEditingTags(false);
  }, [detail, tagsDraft, updateRule]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading rule...</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <p className="text-muted-foreground text-sm">Rule not found</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/rules')}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Rules
        </Button>
      </div>
    );
  }

  const { rule, agents } = detail;
  const _projectName = rule.projectId ? projects.find((p) => p.id === rule.projectId)?.name : null;

  const handleDelete = () => {
    if (confirm('Delete this rule? This cannot be undone.')) {
      deleteRule.mutate(rule.id, { onSuccess: () => navigate('/rules') });
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" className="w-fit" onClick={() => navigate('/rules')}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Rules
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportRule.mutate({ id: rule.id, name: rule.name })}
            disabled={exportRule.isPending}
          >
            <Download className="mr-1.5 h-4 w-4" />
            {exportRule.isPending ? 'Exporting...' : 'Export'}
          </Button>
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
          <ScrollText className="text-primary h-5 w-5" />
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
              <h1 className="text-2xl font-bold tracking-tight">{rule.name}</h1>
              <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Created {timeAgo(rule.createdAt)}</span>
            <span>·</span>
            <span>Updated {timeAgo(rule.updatedAt)}</span>
          </div>
        </div>
      </div>

      {/* Metadata row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Type</span>
          <Combobox
            options={RULE_TYPES.map((t) => ({ value: t, label: t }))}
            value={rule.type}
            onValueChange={(v) => updateRule.mutate({ id: rule.id, data: { type: v } })}
            placeholder="Select type"
            searchPlaceholder="Search or create type..."
            className="h-8 text-xs"
            allowCustom
          />
        </Card>

        <Card className="p-4">
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Project Scope</span>
          <Select
            value={rule.projectId ?? NONE}
            onValueChange={(v) => updateRule.mutate({ id: rule.id, data: { projectId: v === NONE ? null : v } })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>
                <span className="flex items-center gap-1.5">Global (all projects)</span>
              </SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <span className="flex items-center gap-1.5">
                    <FolderOpen className="h-3 w-3" />
                    {p.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>

        <Card className="col-span-full p-4 sm:col-span-2">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Tags</span>
            {!editingTags && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={startEditTags}>
                <Pencil className="h-3 w-3" />
              </Button>
            )}
          </div>
          {editingTags ? (
            <div className="flex items-center gap-2">
              <Input
                value={tagsDraft}
                onChange={(e) => setTagsDraft(e.target.value)}
                placeholder="api, errors, conventions"
                className="h-8 text-xs"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveTags();
                  if (e.key === 'Escape') setEditingTags(false);
                }}
              />
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveTags}>
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingTags(false)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : rule.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {rule.tags.map((tag: string) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : (
            <button
              type="button"
              className="w-full rounded-md border border-dashed p-2 text-center text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
              onClick={startEditTags}
            >
              Add tags...
            </button>
          )}
        </Card>
      </div>

      {/* Content */}
      <EditableCard
        icon={FileText}
        label="Content"
        value={rule.content}
        placeholder="Click to define coding standards and conventions..."
        isPending={updateRule.isPending}
        onSave={(val) => updateRule.mutate({ id: rule.id, data: { content: val } })}
      />

      {/* Used by Agents */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Bot className="h-4 w-4 text-muted-foreground" />
          Used by Agents
        </div>
        {agents.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <p className="text-muted-foreground text-xs italic">No agents are using this rule yet.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {agents.map((agent) => (
              <Link key={agent.id} to={`/agents/${agent.id}`}>
                <Badge variant="secondary" className="cursor-pointer text-xs hover:bg-secondary/80">
                  {agent.name}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
