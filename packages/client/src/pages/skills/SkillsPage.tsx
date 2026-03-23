// React / library
import { useMemo, useState } from 'react';
import { Zap, Plus, Pencil, Trash2 } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SkillDialog } from '@/components/skills/SkillDialog';

// Hooks
import { useSkills, useDeleteSkill } from '@/hooks/use-skills.hook';
import { useProjects } from '@/hooks/use-projects.hook';

// Types
import type { Skill } from '@my-agents/shared';

export function SkillsPage() {
  const { data: skills, isLoading } = useSkills();
  const { data: projects = [] } = useProjects();
  const deleteSkill = useDeleteSkill();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | undefined>();

  const projectMap = useMemo(
    () => new Map(projects.map((p) => [p.id, p.name])),
    [projects],
  );

  const handleCreate = () => {
    setEditingSkill(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (skill: Skill) => {
    setEditingSkill(skill);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this skill?')) {
      deleteSkill.mutate(id);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Skills</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">Define reusable skill templates for agents</p>
        </div>
        <Button onClick={handleCreate} size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          New Skill
        </Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground py-12 text-center text-sm">Loading...</div>
      ) : !skills?.length ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Zap className="text-muted-foreground mx-auto mb-4 h-10 w-10" />
          <h3 className="mb-1 text-base font-medium">No skills yet</h3>
          <p className="text-muted-foreground mb-4 text-sm">Create your first skill template to get started.</p>
          <Button onClick={handleCreate} variant="outline" size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            Create Skill
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {skills.map((skill) => (
            <Card
              key={skill.id}
              className="group relative flex flex-col gap-1.5 p-4 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
                  <Zap className="text-primary h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold">{skill.name}</h3>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-[11px]">
                      {skill.type}
                    </Badge>
                    {skill.projectId && projectMap.get(skill.projectId) && (
                      <Badge variant="outline" className="text-[10px]">
                        Project: {projectMap.get(skill.projectId)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="absolute right-2 top-2 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(skill)} aria-label="Edit skill">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(skill.id)} aria-label="Delete skill">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <SkillDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        skill={editingSkill}
      />
    </div>
  );
}
