// React / library
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Plus, Trash2, Search, FolderOpen } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SkillDialog } from '@/components/skills/SkillDialog';

// Hooks
import { useSkills, useDeleteSkill } from '@/hooks/use-skills.hook';
import { useProjects } from '@/hooks/use-projects.hook';

// Types
import type { Skill } from '@my-agents/shared';

// Constants & utilities
import {
  SKILL_TYPE_OPTIONS,
  SKILL_TYPE_COLORS,
  PROJECT_SCOPE_ALL,
  PROJECT_SCOPE_GLOBAL,
} from './skills-page.constants';
import { timeAgo, contentPreview } from '@/lib/format';

export function SkillsPage() {
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>(PROJECT_SCOPE_ALL);
  const [search, setSearch] = useState('');

  const { data: skills = [], isLoading } = useSkills();
  const { data: projects = [] } = useProjects();
  const deleteSkill = useDeleteSkill();
  const [dialogOpen, setDialogOpen] = useState(false);

  const projectMap = useMemo(
    () => new Map(projects.map((p) => [p.id, p.name])),
    [projects],
  );

  const filtered = useMemo(() => {
    let result = skills;

    if (typeFilter !== 'all') {
      result = result.filter((s) => s.type === typeFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((s) => s.name.toLowerCase().includes(q));
    }

    if (projectFilter === PROJECT_SCOPE_GLOBAL) {
      result = result.filter((s) => !s.projectId);
    } else if (projectFilter !== PROJECT_SCOPE_ALL) {
      result = result.filter((s) => s.projectId === projectFilter);
    }

    return result;
  }, [skills, typeFilter, search, projectFilter]);

  /** Group skills by type when showing all types. */
  const grouped = useMemo(() => {
    if (typeFilter !== 'all') return null;
    const map = new Map<string, Skill[]>();
    for (const skill of filtered) {
      const group = map.get(skill.type) ?? [];
      group.push(skill);
      map.set(skill.type, group);
    }
    return map;
  }, [filtered, typeFilter]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this skill?')) deleteSkill.mutate(id);
  };

  const renderCard = (skill: Skill) => {
    const borderColor = SKILL_TYPE_COLORS[skill.type] ?? 'border-l-gray-300';
    const preview = contentPreview(skill.steps);

    return (
      <Card
        key={skill.id}
        className={`group relative flex cursor-pointer flex-col gap-2 border-l-[3px] p-4 transition-shadow hover:shadow-md ${borderColor}`}
        onClick={() => navigate(`/skills/${skill.id}`)}
      >
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
            <Zap className="text-primary h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold">{skill.name}</h3>
            <div className="mt-1 flex flex-wrap gap-1">
              <Badge variant="secondary" className="text-[11px]">{skill.type}</Badge>
              {skill.projectId && projectMap.get(skill.projectId) && (
                <Badge variant="outline" className="text-[10px]">
                  <FolderOpen className="mr-0.5 h-2.5 w-2.5" />
                  {projectMap.get(skill.projectId)}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {preview && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{preview}</p>
        )}

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">{timeAgo(skill.updatedAt)}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={(e) => handleDelete(skill.id, e)}
            aria-label="Delete skill"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Skills</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Define reusable skill templates for agents
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          New Skill
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search skills..."
            className="h-8 pl-8 text-xs"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-8 w-[180px] text-xs">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            {SKILL_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="h-8 w-[160px] text-xs">
            <SelectValue placeholder="Project scope" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={PROJECT_SCOPE_ALL}>All Projects</SelectItem>
            <SelectItem value={PROJECT_SCOPE_GLOBAL}>Global Only</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground py-12 text-center text-sm">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Zap className="text-muted-foreground mx-auto mb-4 h-10 w-10" />
          <h3 className="mb-1 text-base font-medium">No skills found</h3>
          <p className="text-muted-foreground mb-4 text-sm">
            {search || projectFilter !== PROJECT_SCOPE_ALL
              ? 'Try adjusting your filters.'
              : 'Create your first skill template to get started.'}
          </p>
          {!search && projectFilter === PROJECT_SCOPE_ALL && (
            <Button onClick={() => setDialogOpen(true)} variant="outline" size="sm">
              <Plus className="mr-1.5 h-4 w-4" />
              Create Skill
            </Button>
          )}
        </div>
      ) : grouped ? (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([typeName, typeSkills]) => (
            <div key={typeName}>
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
                {typeName} ({typeSkills.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {typeSkills.map(renderCard)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(renderCard)}
        </div>
      )}

      <SkillDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={(skill) => navigate(`/skills/${skill.id}`)}
      />
    </div>
  );
}
