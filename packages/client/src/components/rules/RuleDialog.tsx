// React / library
import { useState } from 'react';

// Components
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Hooks
import { useProjects } from '@/hooks/use-projects.hook';
import { useCreateRule } from '@/hooks/use-rules.hook';

// Types
import type { Rule } from '@atlas/shared';
import type { RuleDialogProps } from './rules.types';

// Constants
import { NONE, RULE_TYPES } from './rules.constants';

const typeOptions = RULE_TYPES.map((t) => ({ value: t, label: t }));

export function RuleDialog({ open, onOpenChange, onCreated }: RuleDialogProps) {
  const createRule = useCreateRule();
  const { data: projects = [] } = useProjects();

  const [name, setName] = useState('');
  const [type, setType] = useState('General');
  const [tagsStr, setTagsStr] = useState('');
  const [projectId, setProjectId] = useState<string>(NONE);

  const resetForm = () => {
    setName('');
    setType('General');
    setTagsStr('');
    setProjectId(NONE);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = tagsStr
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    createRule.mutate(
      {
        name,
        type,
        tags,
        content: null,
        projectId: projectId === NONE ? null : projectId,
      },
      {
        onSuccess: (newRule: Rule) => {
          resetForm();
          onOpenChange(false);
          onCreated?.(newRule);
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
          <DialogTitle>New Rule</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., API Error Handling"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Combobox
              options={typeOptions}
              value={type}
              onValueChange={setType}
              placeholder="Select type"
              searchPlaceholder="Search or create type..."
              allowCustom
            />
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
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="e.g., api, errors, conventions"
            />
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
            <Button type="submit" disabled={createRule.isPending || !name.trim()}>
              {createRule.isPending ? 'Creating...' : 'Create Rule'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
