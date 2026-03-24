// React / library
import { useState, useCallback } from 'react';
import { Pencil, Check, X, FolderOpen } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Hooks
import { useUpdateMemory } from '@/hooks/use-memory.hook';
import { useProjects } from '@/hooks/use-projects.hook';

// Types
import type { MemoryType, MemoryScope } from '@my-agents/shared';
import type { MemoryExpandedRowProps } from './memory-page.types';

// Constants
import { MEMORY_TYPES, MEMORY_SCOPES } from '@/components/memory/memory.constants';

const NONE = '__none__';

export function MemoryExpandedRow({ memory, projectMap, agentMap }: MemoryExpandedRowProps) {
  const updateMemory = useUpdateMemory();
  const { data: projects = [] } = useProjects();

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [editingContent, setEditingContent] = useState(false);
  const [contentDraft, setContentDraft] = useState('');

  const startEditName = useCallback(() => {
    setNameDraft(memory.name);
    setEditingName(true);
  }, [memory.name]);

  const saveName = useCallback(() => {
    if (!nameDraft.trim()) return;
    updateMemory.mutate({ id: memory.id, data: { name: nameDraft.trim() } });
    setEditingName(false);
  }, [memory.id, nameDraft, updateMemory]);

  const startEditContent = useCallback(() => {
    setContentDraft(memory.content);
    setEditingContent(true);
  }, [memory.content]);

  const saveContent = useCallback(() => {
    if (!contentDraft.trim()) return;
    updateMemory.mutate({ id: memory.id, data: { content: contentDraft.trim() } });
    setEditingContent(false);
  }, [memory.id, contentDraft, updateMemory]);

  const agentName = memory.agentId ? agentMap.get(memory.agentId) ?? 'Unknown' : null;

  return (
    <div className="space-y-4 px-4 pb-4 pl-11">
      {/* Name */}
      <div>
        <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Name</label>
        {editingName ? (
          <div className="flex items-center gap-2">
            <Input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              className="h-8 text-sm"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
            />
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveName}>
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingName(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            className="group flex items-center gap-1.5 rounded-md px-1 -mx-1 text-sm font-medium transition-colors hover:bg-muted/50"
            onClick={startEditName}
          >
            {memory.name}
            <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}
      </div>

      {/* Content */}
      <div>
        <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Content</label>
        {editingContent ? (
          <div className="space-y-2">
            <Textarea
              value={contentDraft}
              onChange={(e) => setContentDraft(e.target.value)}
              rows={5}
              className="resize-y text-sm"
              autoFocus
            />
            <div className="flex justify-end gap-1.5">
              <Button variant="ghost" size="sm" onClick={() => setEditingContent(false)} disabled={updateMemory.isPending}>
                <X className="mr-1 h-3.5 w-3.5" />
                Cancel
              </Button>
              <Button size="sm" onClick={saveContent} disabled={updateMemory.isPending}>
                <Check className="mr-1 h-3.5 w-3.5" />
                {updateMemory.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="w-full cursor-pointer rounded-md bg-muted/40 p-3 text-left text-sm whitespace-pre-wrap leading-relaxed transition-colors hover:bg-muted/60"
            onClick={startEditContent}
          >
            {memory.content}
          </button>
        )}
      </div>

      {/* Metadata row */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Type</label>
          <Select
            value={memory.type}
            onValueChange={(v) => updateMemory.mutate({ id: memory.id, data: { type: v as MemoryType } })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MEMORY_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Scope</label>
          <Select
            value={memory.scope}
            onValueChange={(v) => updateMemory.mutate({ id: memory.id, data: { scope: v as MemoryScope } })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MEMORY_SCOPES.map((s) => (
                <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Project</label>
          <Select
            value={memory.projectId ?? NONE}
            onValueChange={(v) => updateMemory.mutate({ id: memory.id, data: { projectId: v === NONE ? null : v } })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>None</SelectItem>
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
        </div>
      </div>

      {agentName && (
        <p className="text-[11px] text-muted-foreground">
          Created by agent: <span className="font-medium">{agentName}</span>
        </p>
      )}
    </div>
  );
}
