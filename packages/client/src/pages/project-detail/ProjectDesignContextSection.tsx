// React / library
import { Palette, Pencil, X, Save, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

// Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Hooks
import { useAgentProviders } from '@/hooks/use-agent-providers.hook';
import { useGenerateDesignContext, useUpdateProject } from '@/hooks/use-projects.hook';

// Types
import type { ProjectDesignContextSectionProps } from './project-detail-page.types';

export function ProjectDesignContextSection({ project }: ProjectDesignContextSectionProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const updateProject = useUpdateProject();
  const generateDesignContext = useGenerateDesignContext();
  const { data: providers } = useAgentProviders();

  const hasProviders = (providers?.length ?? 0) > 0;
  const isBusy = updateProject.isPending || generateDesignContext.isPending;
  const error = updateProject.error ?? generateDesignContext.error;

  function handleEdit() {
    setDraft(project.designContext ?? '');
    setEditing(true);
  }

  function handleCancel() {
    setEditing(false);
    setDraft('');
    updateProject.reset();
  }

  function handleSave() {
    updateProject.mutate(
      { id: project.id, data: { designContext: draft.trim() || null } },
      { onSuccess: () => setEditing(false) },
    );
  }

  function handleGenerate() {
    generateDesignContext.mutate(project.id);
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="text-muted-foreground h-4 w-4" />
          <h2 className="text-sm font-semibold">Design Context</h2>
          <Badge variant="outline" className="text-[10px] text-muted-foreground">
            injected into UI agent prompts
          </Badge>
        </div>
        {!editing && project.designContext && (
          <div className="flex items-center gap-1">
            {hasProviders && (
              <Button variant="ghost" size="sm" asChild>
                <button type="button" onClick={handleGenerate} disabled={isBusy}>
                  <Sparkles
                    className={`mr-1.5 h-3.5 w-3.5 ${generateDesignContext.isPending ? 'animate-pulse' : ''}`}
                  />
                  {generateDesignContext.isPending ? 'Regenerating...' : 'Regenerate'}
                </button>
              </Button>
            )}
            <Button variant="ghost" size="sm" asChild>
              <button type="button" onClick={handleEdit} disabled={isBusy}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Edit
              </button>
            </Button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={16}
            placeholder="Paste your DESIGN.md content here..."
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs font-mono leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
          />
          {error && <p className="text-destructive text-sm">{error.message}</p>}
          <div className="flex gap-2">
            <Button size="sm" asChild>
              <button type="button" onClick={handleSave} disabled={isBusy}>
                <Save className="mr-1.5 h-3.5 w-3.5" />
                {updateProject.isPending ? 'Saving...' : 'Save'}
              </button>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <button type="button" onClick={handleCancel} disabled={isBusy}>
                <X className="mr-1.5 h-3.5 w-3.5" />
                Cancel
              </button>
            </Button>
          </div>
        </div>
      ) : project.designContext ? (
        <Card className="p-4">
          <pre className="whitespace-pre-wrap text-xs font-mono text-muted-foreground leading-relaxed max-h-64 overflow-y-auto">
            {generateDesignContext.isPending ? 'Generating design context with AI...' : project.designContext}
          </pre>
        </Card>
      ) : (
        <>
          <div className="flex items-start gap-3 rounded-lg border border-dashed px-4 py-5 text-muted-foreground">
            <Palette className="mt-0.5 h-5 w-5 shrink-0 opacity-50" />
            <div className="flex-1">
              <p className="text-xs font-medium">No design context yet</p>
              <p className="text-xs opacity-70">
                Let AI analyze your project and generate a DESIGN.md, or write one manually.
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button size="sm" disabled={isBusy || !hasProviders} asChild>
                <button type="button" onClick={handleGenerate} disabled={isBusy || !hasProviders}>
                  <Sparkles
                    className={`mr-1.5 h-3.5 w-3.5 ${generateDesignContext.isPending ? 'animate-pulse' : ''}`}
                  />
                  {generateDesignContext.isPending ? 'Generating...' : 'Generate with AI'}
                </button>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <button type="button" onClick={handleEdit} disabled={isBusy}>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Write manually
                </button>
              </Button>
            </div>
          </div>

          {!hasProviders && providers !== undefined && (
            <p className="mt-2 text-xs text-muted-foreground">
              No AI providers configured.{' '}
              <Link to="/agents" className="text-primary underline-offset-2 hover:underline">
                Add one in Agents
              </Link>{' '}
              to use AI generation.
            </p>
          )}
        </>
      )}

      {generateDesignContext.isError && !editing && (
        <p className="mt-2 text-sm text-destructive">{generateDesignContext.error.message}</p>
      )}
    </section>
  );
}
