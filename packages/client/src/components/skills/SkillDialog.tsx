// React / library
import { useState } from 'react';

// Components
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Hooks
import { useProjects } from '@/hooks/use-projects.hook';
import { useCreateSkill } from '@/hooks/use-skills.hook';

// Types
import type { Skill, SkillType } from '@atlas/shared';
import type { SkillDialogProps } from './skills.types';

// Constants
import { NONE, SKILL_TYPES } from './skills.constants';

export function SkillDialog({ open, onOpenChange, onCreated }: SkillDialogProps) {
  const createSkill = useCreateSkill();
  const { data: projects = [] } = useProjects();

  const [name, setName] = useState('');
  const [type, setType] = useState<SkillType>('Coding');
  const [projectId, setProjectId] = useState<string>(NONE);

  const resetForm = () => {
    setName('');
    setType('Coding');
    setProjectId(NONE);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    createSkill.mutate(
      {
        name,
        type,
        steps: null,
        inputFormat: null,
        outputFormat: null,
        projectId: projectId === NONE ? null : projectId,
      },
      {
        onSuccess: (newSkill: Skill) => {
          resetForm();
          onOpenChange(false);
          onCreated?.(newSkill);
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) resetForm();
        onOpenChange(val);
      }}
    >
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>New Skill</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Code Review Checklist"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as SkillType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {SKILL_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="projectScope">Project Scope</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select project scope" />
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
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createSkill.isPending || !name.trim()}>
              {createSkill.isPending ? 'Creating...' : 'Create Skill'}
            </Button>
            {createSkill.isError && <p className="text-sm text-destructive">{(createSkill.error as Error).message}</p>}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
