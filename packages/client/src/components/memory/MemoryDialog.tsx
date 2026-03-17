import { useEffect, useState } from 'react';
import type { Memory, MemoryType, MemoryScope } from '@my-agents/shared';
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
import { useCreateMemory, useUpdateMemory } from '@/hooks/use-memory.hook';

const MEMORY_TYPES: MemoryType[] = ['Decision', 'Convention', 'Preference', 'Problem'];
const MEMORY_SCOPES: MemoryScope[] = ['global', 'project'];

type MemoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memory?: Memory;
};

export function MemoryDialog({ open, onOpenChange, memory }: MemoryDialogProps) {
  const createMemory = useCreateMemory();
  const updateMemory = useUpdateMemory();
  const isEditing = !!memory;

  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<MemoryType>('Decision');
  const [scope, setScope] = useState<MemoryScope>('project');

  useEffect(() => {
    if (memory) {
      setName(memory.name);
      setContent(memory.content);
      setType(memory.type);
      setScope(memory.scope);
    } else {
      setName('');
      setContent('');
      setType('Decision');
      setScope('project');
    }
  }, [memory, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: name.trim(),
      content: content.trim(),
      type,
      scope,
    };

    if (isEditing) {
      updateMemory.mutate(
        { id: memory.id, data },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createMemory.mutate(data, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  const isPending = createMemory.isPending || updateMemory.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Memory' : 'New Memory'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., API Error Handling Convention"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="The decision, convention, or preference to remember..."
              rows={4}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as MemoryType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {MEMORY_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="scope">Scope</Label>
            <Select value={scope} onValueChange={(v) => setScope(v as MemoryScope)}>
              <SelectTrigger>
                <SelectValue placeholder="Select scope" />
              </SelectTrigger>
              <SelectContent>
                {MEMORY_SCOPES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" asChild>
              <button type="button" onClick={() => onOpenChange(false)}>
                Cancel
              </button>
            </Button>
            <Button asChild>
              <button
                type="submit"
                disabled={isPending || !name.trim() || !content.trim()}
              >
                {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Memory'}
              </button>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
