// React / library
import { useState } from 'react';

// Components
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

// Hooks
import { useCreateMemory } from '@/hooks/use-memory.hook';
import { useProjects } from '@/hooks/use-projects.hook';

// Types
import type { MemoryScope, MemoryType } from '@atlas/shared';
import type { MemoryDialogProps } from './memory.types';

// Constants
import { MEMORY_SCOPES, MEMORY_TYPES } from './memory.constants';

export function MemoryDialog({ open, onOpenChange }: MemoryDialogProps) {
  const createMemory = useCreateMemory();
  const { data: projects = [] } = useProjects();

  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<MemoryType>('Decision');
  const [scope, setScope] = useState<MemoryScope>('project');
  const [projectId, setProjectId] = useState<string>('');

  const resetForm = () => {
    setName('');
    setContent('');
    setType('Decision');
    setScope('project');
    setProjectId('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMemory.mutate(
      {
        name: name.trim(),
        content: content.trim(),
        type,
        scope,
        ...(scope === 'project' && projectId ? { projectId } : {}),
      },
      {
        onSuccess: () => {
          resetForm();
          onOpenChange(false);
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
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>New Memory</DialogTitle>
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
          <div className="grid grid-cols-2 gap-4">
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
          </div>
          {scope === 'project' && projects.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
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
            <Button type="submit" disabled={createMemory.isPending || !name.trim() || !content.trim()}>
              {createMemory.isPending ? 'Creating...' : 'Create Memory'}
            </Button>
            {createMemory.isError && (
              <p className="text-sm text-destructive">{(createMemory.error as Error).message}</p>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
