// React / library
import {
  BookOpen,
  Brain,
  Code2,
  Database,
  FileText,
  Loader2,
  Network,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

// Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MarkdownContent } from '@/components/ui/markdown-content';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

// Hooks
import {
  useCreateProjectDoc,
  useDeleteProjectDoc,
  useGenerateProjectDoc,
  useProjectDocs,
  useUpdateProjectDoc,
} from '@/hooks/use-project-docs.hook';
import { useProjects } from '@/hooks/use-projects.hook';

// Types
import type { DocType, ProjectDoc } from '@atlas/shared';

const TYPE_CONFIG: Record<DocType, { label: string; icon: typeof FileText; group: string }> = {
  'api-diagram': { label: 'API Endpoints', icon: Code2, group: 'Auto-Generated' },
  'db-schema': { label: 'Database Schema', icon: Database, group: 'Auto-Generated' },
  architecture: { label: 'System Architecture', icon: Network, group: 'Auto-Generated' },
  plan: { label: 'Plan', icon: Brain, group: 'Plans' },
  custom: { label: 'Custom', icon: FileText, group: 'Custom' },
};

const AI_TYPES: DocType[] = ['api-diagram', 'db-schema', 'architecture'];

export function DocumentsPage() {
  const { data: projects = [] } = useProjects();
  const [projectId, setProjectId] = useState<string>('');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [previewContent, setPreviewContent] = useState('');
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const { data: docs = [], isLoading } = useProjectDocs(projectId || undefined);
  const generateDoc = useGenerateProjectDoc(projectId);
  const createDoc = useCreateProjectDoc(projectId);
  const updateDoc = useUpdateProjectDoc(projectId);
  const deleteDoc = useDeleteProjectDoc(projectId);

  const selectedDoc = useMemo(
    () => docs.find((d) => d.id === selectedDocId) ?? null,
    [docs, selectedDocId],
  );

  useEffect(() => {
    if (docs.length > 0 && !selectedDoc) {
      setSelectedDocId(docs[0].id);
    }
  }, [docs, selectedDoc]);

  // Debounced preview for edit mode
  useEffect(() => {
    if (!editing) return;
    const timer = setTimeout(() => setPreviewContent(editContent), 500);
    return () => clearTimeout(timer);
  }, [editContent, editing]);

  const grouped = useMemo(() => {
    const groups: Record<string, ProjectDoc[]> = { 'Auto-Generated': [], Plans: [], Custom: [] };
    for (const doc of docs) {
      const cfg = TYPE_CONFIG[doc.type as DocType];
      const group = cfg?.group ?? 'Custom';
      if (!groups[group]) groups[group] = [];
      groups[group].push(doc);
    }
    return groups;
  }, [docs]);

  const handleStartEdit = useCallback(() => {
    if (!selectedDoc) return;
    setEditTitle(selectedDoc.title);
    setEditContent(selectedDoc.content);
    setPreviewContent(selectedDoc.content);
    setEditing(true);
  }, [selectedDoc]);

  const handleSaveEdit = useCallback(() => {
    if (!selectedDoc) return;
    updateDoc.mutate(
      { docId: selectedDoc.id, data: { title: editTitle, content: editContent } },
      { onSuccess: () => setEditing(false) },
    );
  }, [selectedDoc, editTitle, editContent, updateDoc]);

  const handleCreate = useCallback(() => {
    if (!newTitle.trim()) return;
    createDoc.mutate(
      { title: newTitle, type: 'custom', content: newContent },
      {
        onSuccess: (doc) => {
          setCreating(false);
          setNewTitle('');
          setNewContent('');
          setSelectedDocId(doc.id);
        },
      },
    );
  }, [newTitle, newContent, createDoc]);

  const handleDelete = useCallback(() => {
    if (!selectedDoc) return;
    deleteDoc.mutate(selectedDoc.id, {
      onSuccess: () => {
        setSelectedDocId(null);
        setEditing(false);
      },
    });
  }, [selectedDoc, deleteDoc]);

  const handleGenerate = useCallback(
    (type: DocType) => {
      generateDoc.mutate(
        { type: type as 'api-diagram' | 'db-schema' | 'architecture' },
        {
          onSuccess: (doc) => setSelectedDocId(doc.id),
        },
      );
    },
    [generateDoc],
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <BookOpen className="h-8 w-8 text-muted-foreground" />
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground mt-1">Project documentation, diagrams, and plans</p>
        </div>
      </div>

      {/* Project selector */}
      <div className="mb-6">
        <Select value={projectId} onValueChange={(v) => { setProjectId(v); setSelectedDocId(null); setEditing(false); }}>
          <SelectTrigger className="w-full max-w-sm">
            <SelectValue placeholder="Select a project..." />
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

      {!projectId && (
        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
          <p className="text-sm text-muted-foreground">Select a project to view its documentation</p>
        </div>
      )}

      {projectId && isLoading && (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {projectId && !isLoading && (
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 shrink-0 space-y-4">
            {/* AI generate buttons */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Auto-Generated</p>
              {AI_TYPES.map((type) => {
                const cfg = TYPE_CONFIG[type];
                const Icon = cfg.icon;
                const existing = docs.find((d) => d.type === type && d.source === 'ai');
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => existing ? setSelectedDocId(existing.id) : handleGenerate(type)}
                    className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                      selectedDocId === existing?.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{cfg.label}</span>
                    {!existing && (
                      <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0">
                        Generate
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Plan docs */}
            {grouped.Plans.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Plans</p>
                {grouped.Plans.map((doc) => {
                  const Icon = TYPE_CONFIG.plan.icon;
                  return (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => setSelectedDocId(doc.id)}
                      className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                        selectedDocId === doc.id
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{doc.title}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Custom docs */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Custom</p>
              {grouped.Custom.map((doc) => {
                const Icon = TYPE_CONFIG.custom.icon;
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => { setSelectedDocId(doc.id); setEditing(false); }}
                    className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                      selectedDocId === doc.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{doc.title}</span>
                  </button>
                );
              })}
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-muted-foreground"
                onClick={() => { setCreating(true); setEditing(false); setSelectedDocId(null); }}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Doc
              </Button>
            </div>
          </div>

          {/* Main panel */}
          <div className="flex-1 min-w-0">
            {/* Creating new doc */}
            {creating && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">New Document</h2>
                  <Button variant="ghost" size="sm" onClick={() => setCreating(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  placeholder="Document title..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Textarea
                    placeholder="Write markdown here..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="min-h-[400px] font-mono text-xs"
                  />
                  <div className="rounded-md border p-4 overflow-auto max-h-[500px]">
                    <MarkdownContent content={newContent || '*Preview will appear here...*'} />
                  </div>
                </div>
                <Button onClick={handleCreate} disabled={!newTitle.trim() || createDoc.isPending}>
                  {createDoc.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Document
                </Button>
              </div>
            )}

            {/* No doc selected */}
            {!creating && !selectedDoc && docs.length === 0 && (
              <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">No documentation yet</p>
                  <p className="text-xs text-muted-foreground">Generate AI diagrams or create custom docs</p>
                </div>
              </div>
            )}

            {!creating && !selectedDoc && docs.length > 0 && (
              <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Select a document from the sidebar</p>
              </div>
            )}

            {/* Viewing a doc */}
            {!creating && selectedDoc && !editing && (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold">{selectedDoc.title}</h2>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">
                        {TYPE_CONFIG[selectedDoc.type as DocType]?.label ?? selectedDoc.type}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {selectedDoc.source === 'ai' ? 'AI Generated' : 'Manual'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Updated {new Date(selectedDoc.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {AI_TYPES.includes(selectedDoc.type as DocType) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerate(selectedDoc.type as DocType)}
                        disabled={generateDoc.isPending}
                      >
                        {generateDoc.isPending ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        Regenerate
                      </Button>
                    )}
                    {selectedDoc.source === 'user' && (
                      <Button variant="outline" size="sm" onClick={handleStartEdit}>
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        Edit
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={handleDelete} disabled={deleteDoc.isPending}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="rounded-md border p-6 overflow-auto">
                  <MarkdownContent content={selectedDoc.content || '*No content yet.*'} />
                </div>
              </div>
            )}

            {/* Editing a doc */}
            {!creating && selectedDoc && editing && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="max-w-sm font-semibold"
                  />
                  <div className="flex items-center gap-1.5">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveEdit} disabled={updateDoc.isPending}>
                      {updateDoc.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[500px] font-mono text-xs"
                  />
                  <div className="rounded-md border p-4 overflow-auto max-h-[600px]">
                    <MarkdownContent content={previewContent || '*Preview will appear here...*'} />
                  </div>
                </div>
              </div>
            )}

            {/* Generation in progress overlay */}
            {generateDoc.isPending && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating documentation... This may take a moment.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
