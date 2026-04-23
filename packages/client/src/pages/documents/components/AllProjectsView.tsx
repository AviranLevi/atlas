// React / library
import { ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { useState } from 'react';

// Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MarkdownContent } from '@/components/ui/markdown-content';

// Types
import type { DocType, ProjectDoc } from '@atlas/shared';

// Constants
import { TYPE_CONFIG } from '../documents.constants';

type AllProjectsViewProps = {
  groupedByProject: Map<string, ProjectDoc[]>;
  projectMap: Map<string, { id: string; name: string; color: string | null }>;
  selectedDocId: string | null;
  selectedDoc: ProjectDoc | null;
  onSelectDoc: (id: string | null) => void;
};

export function AllProjectsView({
  groupedByProject,
  projectMap,
  selectedDocId,
  selectedDoc,
  onSelectDoc,
}: AllProjectsViewProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleCollapse = (projectId: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  };

  if (groupedByProject.size === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">No documentation across any project</p>
          <p className="text-xs text-muted-foreground">Select a project to create or generate docs</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      <div className="flex-1 space-y-4">
        {!selectedDoc && (
          <>
            <p className="text-sm text-muted-foreground">
              Browsing docs across all projects. Select a project to create or generate docs.
            </p>
            {Array.from(groupedByProject.entries()).map(([projectId, projectDocs]) => {
              const project = projectMap.get(projectId);
              const isCollapsed = collapsed.has(projectId);
              return (
                <Card key={projectId} className="overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleCollapse(projectId)}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    {project?.color && (
                      <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
                    )}
                    <span className="text-sm font-medium">{project?.name ?? 'Unknown Project'}</span>
                    <Badge variant="secondary" className="ml-auto text-[10px]">
                      {projectDocs.length}
                    </Badge>
                  </button>
                  {!isCollapsed && (
                    <div className="border-t px-4 py-2 space-y-1">
                      {projectDocs.map((doc) => {
                        const cfg = TYPE_CONFIG[doc.type as DocType];
                        const Icon = cfg?.icon ?? FileText;
                        return (
                          <button
                            key={doc.id}
                            type="button"
                            onClick={() => onSelectDoc(doc.id)}
                            className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                              selectedDocId === doc.id
                                ? 'bg-primary text-primary-foreground'
                                : 'text-foreground hover:bg-muted'
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{doc.title}</span>
                            <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0">
                              {cfg?.label ?? doc.type}
                            </Badge>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </Card>
              );
            })}
          </>
        )}

        {selectedDoc && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => onSelectDoc(null)}>
                Back to all docs
              </Button>
            </div>
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
                  {projectMap.get(selectedDoc.projectId)?.name ?? 'Unknown'} · Updated{' '}
                  {new Date(selectedDoc.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="rounded-md border p-6 overflow-auto">
              <MarkdownContent content={selectedDoc.content || '*No content yet.*'} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
