// FILE_PATH: packages/client/src/components/onboarding/HelpDialog.tsx

// React / library
import { CheckCircle2, PauseCircle, PlayCircle, RotateCcw, Sparkles } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

// Hooks
import { useTourState, useTourStateMutations } from '@/hooks/use-tour-state.hook';

// Lib
import { startTour } from '@/lib/tours/tour-engine';
import { loadTourById, TOUR_CATALOG } from '@/lib/tours/tour-registry';

// Types
import type { TourId } from '@/lib/tours/tour-types';

type HelpDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function HelpDialog({ open, onOpenChange }: HelpDialogProps) {
  const { toursPaused, isCompleted } = useTourState();
  const { resumeTours, pauseTours, resetTour, resetGlobalDismissals } = useTourStateMutations();

  async function handleRunTour(id: TourId) {
    onOpenChange(false);
    const def = await loadTourById(id);
    if (!def) return;
    // Wipe the snooze/completed bits so the tour fires regardless of past state.
    await resetTour(id);
    // Small delay lets the dialog close cleanly before the tour overlay mounts.
    setTimeout(() => {
      void startTour(def);
    }, 200);
  }

  async function handleTogglePause(checked: boolean) {
    if (checked) {
      // checked = "Tours on"
      await resumeTours();
      await resetGlobalDismissals();
    } else {
      await pauseTours();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Help &amp; onboarding</DialogTitle>
          <DialogDescription>
            Re-run a tour any time. Tours auto-fire once per page on first visit, then leave you alone.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between rounded-md border p-3">
          <div className="flex items-center gap-2">
            {toursPaused ? (
              <PauseCircle className="h-4 w-4 text-muted-foreground" aria-hidden />
            ) : (
              <PlayCircle className="h-4 w-4 text-emerald-500" aria-hidden />
            )}
            <div>
              <p className="text-sm font-medium">Auto-fire tours</p>
              <p className="text-xs text-muted-foreground">
                {toursPaused
                  ? "Paused — we won't interrupt. Toggle on to resume."
                  : 'Tours fire once when you reach a new page.'}
              </p>
            </div>
          </div>
          <Switch
            checked={!toursPaused}
            onCheckedChange={(c) => void handleTogglePause(c)}
            aria-label="Toggle tour auto-fire"
          />
        </div>

        <div className="-mx-1 mt-2 max-h-[320px] space-y-1 overflow-y-auto px-1">
          {TOUR_CATALOG.length === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-center">
              <Sparkles className="mx-auto mb-2 h-5 w-5 text-muted-foreground" aria-hidden />
              <p className="text-sm font-medium">No tours yet</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Tours roll out across the app over the next few releases.
              </p>
            </div>
          ) : (
            TOUR_CATALOG.map((entry) => {
              const done = isCompleted(entry.id);
              return (
                <div key={entry.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-medium">{entry.title}</p>
                      {done && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" aria-hidden />}
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{entry.description}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => void handleRunTour(entry.id)}>
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                    Run
                  </Button>
                </div>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
