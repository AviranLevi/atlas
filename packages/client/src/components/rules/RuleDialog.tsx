import { useEffect, useState } from 'react';
import type { Rule, RuleType } from '@my-agents/shared';
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
import { useCreateRule, useUpdateRule } from '@/hooks/use-rules.hook';

const RULE_TYPES: RuleType[] = ['Backend', 'Frontend', 'Godot', 'General'];

type RuleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: Rule;
};

export function RuleDialog({ open, onOpenChange, rule }: RuleDialogProps) {
  const createRule = useCreateRule();
  const updateRule = useUpdateRule();
  const isEditing = !!rule;

  const [name, setName] = useState('');
  const [type, setType] = useState<RuleType>('General');
  const [tagsStr, setTagsStr] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (rule) {
      setName(rule.name);
      setType(rule.type);
      setTagsStr(rule.tags.join(', '));
      setContent(rule.content ?? '');
    } else {
      setName('');
      setType('General');
      setTagsStr('');
      setContent('');
    }
  }, [rule, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = tagsStr
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const data = {
      name,
      type,
      tags,
      content: content.trim() || null,
    };

    if (isEditing) {
      updateRule.mutate(
        { id: rule.id, data },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createRule.mutate(data, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  const isPending = createRule.isPending || updateRule.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Rule' : 'New Rule'}</DialogTitle>
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
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as RuleType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {RULE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
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
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Coding standards and conventions..."
              rows={6}
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
                {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Rule'}
              </button>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
