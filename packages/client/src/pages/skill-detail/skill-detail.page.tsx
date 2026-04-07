// React / library
import {
  ArrowLeft,
  Zap,
  ListOrdered,
  LogIn,
  LogOut,
  Bot,
  Trash2,
  Check,
  X,
  Pencil,
  FolderOpen,
  Download,
} from 'lucide-react';
import { useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

// Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EditableCard } from '@/components/ui/editable-card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Hooks
import { useProjects } from '@/hooks/use-projects.hook';
import { useSkillDetail } from '@/hooks/use-skills.hook';
import { useUpdateSkill, useDeleteSkill } from '@/hooks/use-skills.hook';

// Lib
import { timeAgo } from '@/lib/format';

// Types
import type { SkillType } from '@atlas/shared';

// Constants
import { SKILL_TYPES, NONE } from '@/components/skills/skills.constants';

export function SkillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: detail, isLoading } = useSkillDetail(id);
  const { data: projects = [] } = useProjects();
  const updateSkill = useUpdateSkill();
  const deleteSkill = useDeleteSkill();

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  const startEditName = useCallback(() => {
    if (!detail) return;
    setNameDraft(detail.skill.name);
    setEditingName(true);
  }, [detail]);

  const saveName = useCallback(() => {
    if (!detail || !nameDraft.trim()) return;
    updateSkill.mutate({ id: detail.skill.id, data: { name: nameDraft.trim() } });
    setEditingName(false);
  }, [detail, nameDraft, updateSkill]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading skill...</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <p className="text-muted-foreground text-sm">Skill not found</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/skills')}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Skills
        </Button>
      </div>
    );
  }

  const { skill, agents } = detail;

  const handleDelete = () => {
    if (confirm('Delete this skill? This cannot be undone.')) {
      deleteSkill.mutate(skill.id, { onSuccess: () => navigate('/skills') });
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" className="w-fit" onClick={() => navigate('/skills')}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Skills
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/api/v1/packages/export/skill/${skill.id}`, '_blank')}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export
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
          <Zap className="text-primary h-5 w-5" />
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
              <h1 className="text-2xl font-bold tracking-tight">{skill.name}</h1>
              <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Created {timeAgo(skill.createdAt)}</span>
            <span>·</span>
            <span>Updated {timeAgo(skill.updatedAt)}</span>
          </div>
        </div>
      </div>

      {/* Metadata row */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-4">
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Type</span>
          <Select
            value={skill.type ?? undefined}
            onValueChange={(v) => updateSkill.mutate({ id: skill.id, data: { type: v as SkillType } })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SKILL_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>

        <Card className="p-4">
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Project Scope</span>
          <Select
            value={skill.projectId ?? NONE}
            onValueChange={(v) => updateSkill.mutate({ id: skill.id, data: { projectId: v === NONE ? null : v } })}
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
      </div>

      {/* Editable content cards */}
      <EditableCard
        icon={ListOrdered}
        label="Steps"
        value={skill.steps}
        placeholder="Click to define step-by-step instructions..."
        isPending={updateSkill.isPending}
        onSave={(val) => updateSkill.mutate({ id: skill.id, data: { steps: val } })}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <EditableCard
          icon={LogIn}
          label="Input Format"
          value={skill.inputFormat}
          placeholder="Click to define expected input structure..."
          isPending={updateSkill.isPending}
          onSave={(val) => updateSkill.mutate({ id: skill.id, data: { inputFormat: val } })}
        />
        <EditableCard
          icon={LogOut}
          label="Output Format"
          value={skill.outputFormat}
          placeholder="Click to define expected output structure..."
          isPending={updateSkill.isPending}
          onSave={(val) => updateSkill.mutate({ id: skill.id, data: { outputFormat: val } })}
        />
      </div>

      {/* Used by Agents */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Bot className="h-4 w-4 text-muted-foreground" />
          Used by Agents
        </div>
        {agents.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <p className="text-muted-foreground text-xs italic">No agents are using this skill yet.</p>
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
