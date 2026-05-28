// React / library
import { Milestone, Plus } from 'lucide-react';
import { useState } from 'react';

// Components
import { PhaseCard } from '@/components/phases/PhaseCard';
import { PhaseDialog } from '@/components/phases/PhaseDialog';
import { Button } from '@/components/ui/button';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';

// Hooks
import { usePhases, useDeletePhase } from '@/hooks/use-phases.hook';

// Types
import type { Phase } from '@atlas/shared';
import type { ProjectPhasesSectionProps } from '../project-detail.types';

export function ProjectPhasesSection({ projectId }: ProjectPhasesSectionProps) {
  const { data: phases = [] } = usePhases(projectId);
  const deletePhase = useDeletePhase();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<Phase | undefined>();
  const [deletePhaseId, setDeletePhaseId] = useState<string | null>(null);

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Milestone className="text-muted-foreground h-4 w-4" />
          <h2 className="text-sm font-semibold">Phases ({phases.length})</h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setEditingPhase(undefined);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add Phase
        </Button>
      </div>

      {phases.length === 0 ? (
        <div className="flex items-center gap-3 rounded-lg border border-dashed px-4 py-5 text-muted-foreground">
          <Milestone className="h-5 w-5 shrink-0 opacity-50" />
          <div>
            <p className="text-xs font-medium">No phases defined</p>
            <p className="text-xs opacity-70">Break the project into phases to track progress milestones.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {phases.map((phase) => (
            <PhaseCard
              key={phase.id}
              phase={phase}
              onEdit={(p) => {
                setEditingPhase(p);
                setDialogOpen(true);
              }}
              onDelete={(phaseId) => setDeletePhaseId(phaseId)}
            />
          ))}
        </div>
      )}

      <PhaseDialog open={dialogOpen} onOpenChange={setDialogOpen} projectId={projectId} phase={editingPhase} />

      <ConfirmDeleteDialog
        open={!!deletePhaseId}
        onOpenChange={(open) => !open && setDeletePhaseId(null)}
        title="Delete phase"
        description="This will permanently delete the phase. Tasks in this phase will be unassigned. This action cannot be undone."
        isPending={deletePhase.isPending}
        onConfirm={() => {
          if (deletePhaseId) {
            deletePhase.mutate(deletePhaseId, { onSuccess: () => setDeletePhaseId(null) });
          }
        }}
      />
    </section>
  );
}
