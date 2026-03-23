// React / library
import { useEffect, useState } from 'react';

// Components
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Hooks
import { useCreateSkill, useUpdateSkill } from '@/hooks/use-skills.hook';
import { useProjects } from '@/hooks/use-projects.hook';

// Types
import type { SkillType } from '@my-agents/shared';
import type { SkillDialogProps } from './skills.types';

// Constants
import { SKILL_TYPES, NONE } from './skills.constants';

export function SkillDialog({ open, onOpenChange, skill }: SkillDialogProps) {
  const createSkill = useCreateSkill();
  const updateSkill = useUpdateSkill();
  const { data: projects = [] } = useProjects();
  const isEditing = !!skill;

  const [name, setName] = useState('');
  const [type, setType] = useState<SkillType>('Coding');
  const [steps, setSteps] = useState('');
  const [inputFormat, setInputFormat] = useState('');
  const [outputFormat, setOutputFormat] = useState('');
  const [projectId, setProjectId] = useState<string>(NONE);

  useEffect(() => {
    if (skill) {
      setName(skill.name);
      setType(skill.type);
      setSteps(skill.steps ?? '');
      setInputFormat(skill.inputFormat ?? '');
      setOutputFormat(skill.outputFormat ?? '');
      setProjectId(skill.projectId ?? NONE);
    } else {
      setName('');
      setType('Coding');
      setSteps('');
      setInputFormat('');
      setOutputFormat('');
      setProjectId(NONE);
    }
  }, [skill, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name,
      type,
      steps: steps.trim() || null,
      inputFormat: inputFormat.trim() || null,
      outputFormat: outputFormat.trim() || null,
      projectId: projectId === NONE ? null : projectId,
    };

    if (isEditing) {
      updateSkill.mutate(
        { id: skill.id, data },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createSkill.mutate(data, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  const isPending = createSkill.isPending || updateSkill.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Skill' : 'New Skill'}</DialogTitle>
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
          <div className="space-y-2">
            <Label htmlFor="steps">Steps</Label>
            <Textarea
              id="steps"
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              placeholder="Step-by-step instructions..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inputFormat">Input Format</Label>
            <Textarea
              id="inputFormat"
              value={inputFormat}
              onChange={(e) => setInputFormat(e.target.value)}
              placeholder="Expected input structure..."
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="outputFormat">Output Format</Label>
            <Textarea
              id="outputFormat"
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value)}
              placeholder="Expected output structure..."
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" asChild>
              <button type="button" onClick={() => onOpenChange(false)}>
                Cancel
              </button>
            </Button>
            <Button asChild>
              <button type="submit" disabled={isPending || !name.trim()}>
                {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Skill'}
              </button>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
