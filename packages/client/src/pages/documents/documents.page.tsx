// React / library
import { BookOpen, FileText, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

// Context
import { useActiveProject } from '@/contexts/ProjectContext';

// Hooks
import {
  useAllProjectDocs,
  useCreateProjectDoc,
  useDeleteProjectDoc,
  useGenerateProjectDoc,
  useProjectDocs,
  useUpdateProjectDoc,
} from '@/hooks/use-project-docs.hook';

// Types
import type { DocType, ProjectDoc } from '@atlas/shared';
import type { SelectedItem } from './documents.types';

// Components
import { EmptyState } from '@/components/empty-state/EmptyState';
import { AiTypePrompt } from './components/AiTypePrompt';
import { AllProjectsView } from './components/AllProjectsView';
import { DocCreator } from './components/DocCreator';
import { DocEditor } from './components/DocEditor';
import { DocViewer } from './components/DocViewer';
import { DocsSidebar } from './components/DocsSidebar';

export function DocumentsPage() {
  const { activeProjectId, projects } = useActiveProject();

  const [selected, setSelected] = useState<SelectedItem>(null);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [previewContent, setPreviewContent] = useState('');
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const { data: projectDocs = [], isLoading: isLoadingProject } = useProjectDocs(activeProjectId ?? undefined);
  const { data: allDocs = [], isLoading: isLoadingAll } = useAllProjectDocs(!activeProjectId);

  const isProjectMode = !!activeProjectId;
  const docs = isProjectMode ? projectDocs : allDocs;
  const isLoading = isProjectMode ? isLoadingProject : isLoadingAll;

  const generateDoc = useGenerateProjectDoc(activeProjectId ?? '');
  const createDoc = useCreateProjectDoc(activeProjectId ?? '');
  const updateDoc = useUpdateProjectDoc(activeProjectId ?? '');
  const deleteDoc = useDeleteProjectDoc(activeProjectId ?? '');

  const selectedDocId = selected?.kind === 'doc' ? selected.id : null;
  const selectedAiType = selected?.kind === 'ai-type' ? selected.type : null;
  const selectedDoc = useMemo(() => docs.find((d) => d.id === selectedDocId) ?? null, [docs, selectedDocId]);

  useEffect(() => {
    setSelected(null);
    setEditing(false);
    setCreating(false);
  }, [activeProjectId]);

  useEffect(() => {
    if (!editing) return;
    const timer = setTimeout(() => setPreviewContent(editContent), 500);
    return () => clearTimeout(timer);
  }, [editContent, editing]);

  const grouped = useMemo(() => {
    const groups: Record<string, ProjectDoc[]> = { 'Auto-Generated': [], Plans: [], Custom: [] };
    for (const doc of docs) {
      const group = doc.type === 'plan' ? 'Plans' : doc.type === 'custom' ? 'Custom' : 'Auto-Generated';
      groups[group].push(doc);
    }
    return groups;
  }, [docs]);

  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  const groupedByProject = useMemo(() => {
    if (isProjectMode) return null;
    const map = new Map<string, ProjectDoc[]>();
    for (const doc of allDocs) {
      const list = map.get(doc.projectId) ?? [];
      list.push(doc);
      map.set(doc.projectId, list);
    }
    return map;
  }, [isProjectMode, allDocs]);

  const handleGenerate = useCallback(
    (type: DocType) => {
      generateDoc.mutate(
        { type: type as 'api-diagram' | 'db-schema' | 'architecture' },
        { onSuccess: (doc) => setSelected({ kind: 'doc', id: doc.id }) },
      );
    },
    [generateDoc],
  );

  const handleCreate = useCallback(() => {
    if (!newTitle.trim()) return;
    createDoc.mutate(
      { title: newTitle, type: 'custom', content: newContent },
      {
        onSuccess: (doc) => {
          setCreating(false);
          setNewTitle('');
          setNewContent('');
          setSelected({ kind: 'doc', id: doc.id });
        },
      },
    );
  }, [newTitle, newContent, createDoc]);

  const handleSaveEdit = useCallback(() => {
    if (!selectedDoc) return;
    updateDoc.mutate(
      { docId: selectedDoc.id, data: { title: editTitle, content: editContent } },
      { onSuccess: () => setEditing(false) },
    );
  }, [selectedDoc, editTitle, editContent, updateDoc]);

  const handleDelete = useCallback(() => {
    if (!selectedDoc) return;
    deleteDoc.mutate(selectedDoc.id, {
      onSuccess: () => {
        setSelected(null);
        setEditing(false);
      },
    });
  }, [selectedDoc, deleteDoc]);

  const handleStartEdit = useCallback(() => {
    if (!selectedDoc) return;
    setEditTitle(selectedDoc.title);
    setEditContent(selectedDoc.content);
    setPreviewContent(selectedDoc.content);
    setEditing(true);
  }, [selectedDoc]);

  const selectAiItem = useCallback(
    (type: DocType) => {
      const existing = docs.find((d) => d.type === type && d.source === 'ai');
      setSelected(existing ? { kind: 'doc', id: existing.id } : { kind: 'ai-type', type });
      setEditing(false);
      setCreating(false);
    },
    [docs],
  );

  const isAiItemActive = useCallback(
    (type: DocType) => {
      const existing = docs.find((d) => d.type === type && d.source === 'ai');
      return (existing && selectedDocId === existing.id) || selectedAiType === type;
    },
    [docs, selectedDocId, selectedAiType],
  );

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <BookOpen className="h-8 w-8 text-muted-foreground" />
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground mt-1">Project documentation, diagrams, and plans</p>
        </div>
      </div>

      {isLoading && (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && !isProjectMode && (
        <AllProjectsView
          groupedByProject={groupedByProject!}
          projectMap={projectMap}
          selectedDocId={selectedDocId}
          selectedDoc={selectedDoc}
          onSelectDoc={(id) => setSelected(id ? { kind: 'doc', id } : null)}
        />
      )}

      {!isLoading && isProjectMode && (
        <div className="flex gap-6">
          <DocsSidebar
            docs={docs}
            grouped={grouped}
            selectedDocId={selectedDocId}
            selectedAiType={selectedAiType}
            onSelectAiItem={selectAiItem}
            onSelectDoc={(id) => {
              setSelected({ kind: 'doc', id });
              setEditing(false);
              setCreating(false);
            }}
            onStartCreate={() => {
              setCreating(true);
              setEditing(false);
              setSelected(null);
            }}
            isAiItemActive={isAiItemActive}
          />

          <div className="flex-1 min-w-0">
            {creating && (
              <DocCreator
                title={newTitle}
                content={newContent}
                onTitleChange={setNewTitle}
                onContentChange={setNewContent}
                onCreate={handleCreate}
                onCancel={() => setCreating(false)}
                isCreating={createDoc.isPending}
              />
            )}

            {!creating && selectedAiType && (
              <AiTypePrompt
                type={selectedAiType}
                onGenerate={() => handleGenerate(selectedAiType)}
                isGenerating={generateDoc.isPending}
              />
            )}

            {!creating &&
              !selectedAiType &&
              !selectedDoc &&
              (docs.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No documentation yet"
                  body="Generate diagrams (architecture, DB schema, API) from your code, or write a custom doc."
                  compact
                />
              ) : (
                <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
                  <p className="text-sm text-muted-foreground">Select a document from the sidebar</p>
                </div>
              ))}

            {!creating && !selectedAiType && selectedDoc && !editing && (
              <DocViewer
                doc={selectedDoc}
                onRegenerate={() => handleGenerate(selectedDoc.type as DocType)}
                onEdit={handleStartEdit}
                onDelete={handleDelete}
                isRegenerating={generateDoc.isPending}
                isDeleting={deleteDoc.isPending}
              />
            )}

            {!creating && !selectedAiType && selectedDoc && editing && (
              <DocEditor
                title={editTitle}
                content={editContent}
                previewContent={previewContent}
                onTitleChange={setEditTitle}
                onContentChange={setEditContent}
                onSave={handleSaveEdit}
                onCancel={() => setEditing(false)}
                isSaving={updateDoc.isPending}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
