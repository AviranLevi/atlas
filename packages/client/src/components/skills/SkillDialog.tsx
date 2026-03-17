import { useEffect, useState } from 'react';
import type { Skill, SkillType } from '@my-agents/shared';
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
import { useCreateSkill, useUpdateSkill } from '@/hooks/use-skills.hook';

const SKILL_TYPES: SkillType[] = [
  'Planning',
  'Coding',
  'Review',
  'Architecture / Data',
  'Planning / Roadmapping',
  'Design / Systems',
  'Design',
  'Design / Balancing',
];

type SkillDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skill?: Skill;
};

export function SkillDialog({ open, onOpenChange, skill }: SkillDialogProps) {
  const createSkill = useCreateSkill();
  const updateSkill = useUpdateSkill();
  const isEditing = !!skill;

  const [name, setName] = useState('');
  const [type, setType] = useState<SkillType>('Coding');
  const [steps, setSteps] = useState('');
  const [inputFormat, setInputFormat] = useState('');
  const [outputFormat, setOutputFormat] = useState('');

  useEffect(() => {
    if (skill) {
      setName(skill.name);
      setType(skill.type);
      setSteps(skill.steps ?? '');
      setInputFormat(skill.inputFormat ?? '');
      setOutputFormat(skill.outputFormat ?? '');
    } else {
      setName('');
      setType('Coding');
      setSteps('');
      setInputFormat('');
      setOutputFormat('');
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
