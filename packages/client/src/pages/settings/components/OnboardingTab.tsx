// FILE_PATH: packages/client/src/pages/settings/components/OnboardingTab.tsx

// React / library
import { CheckCircle2, RotateCcw, Sparkles } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

// Hooks
import { useTourState, useTourStateMutations } from '@/hooks/use-tour-state.hook';

// Lib
import { startTour } from '@/lib/tours/tour-engine';
import { loadTourById, TOUR_CATALOG } from '@/lib/tours/tour-registry';

// Types
import type { TourId } from '@/lib/tours/tour-types';

const TOUR_DEBUG_ENABLED = import.meta.env.VITE_ATLAS_TOUR_DEBUG === 'true';

/**
 * Settings → Onboarding. Mirrors the help center but lives where users
 * actually go to manage app preferences. Use the same handlers.
 */
export function OnboardingTab() {
  const { toursPaused, isCompleted, globalDismissals, fatigueThreshold, getTelemetry } = useTourState();
  const { resumeTours, pauseTours, resetTour, resetGlobalDismissals } = useTourStateMutations();

  async function handleRunTour(id: TourId) {
    const def = await loadTourById(id);
    if (!def) return;
    await resetTour(id);
    setTimeout(() => {
      void startTour(def);
    }, 200);
  }

  async function handleTogglePause(checked: boolean) {
    if (checked) {
      await resumeTours();
      await resetGlobalDismissals();
    } else {
      await pauseTours();
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tours</CardTitle>
          <CardDescription>
            Short, page-scoped guided tours fire automatically the first time you reach a page. They cap at five steps,
            never run two at once, and snooze themselves if you skip them.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Auto-fire tours</p>
              <p className="text-xs text-muted-foreground">
                {toursPaused
                  ? `Paused${globalDismissals >= fatigueThreshold ? ' (you skipped 3 in a row)' : ''}. Toggle on to resume.`
                  : 'Tours fire once per page on first visit, then leave you alone.'}
              </p>
            </div>
            <Switch
              checked={!toursPaused}
              onCheckedChange={(c) => void handleTogglePause(c)}
              aria-label="Toggle tour auto-fire"
            />
          </div>
        </CardContent>
      </Card>

      {TOUR_DEBUG_ENABLED && (
        <Card>
          <CardHeader>
            <CardTitle>Tour analytics (local-only)</CardTitle>
            <CardDescription>
              Debug counters from <code className="text-xs">preferences</code>. Visible because{' '}
              <code className="text-xs">VITE_ATLAS_TOUR_DEBUG=true</code>. Never sent off-device.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-md border">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Tour</th>
                    <th className="px-3 py-2 text-right font-medium">Completed</th>
                    <th className="px-3 py-2 text-right font-medium">Skipped</th>
                    <th className="px-3 py-2 text-right font-medium">Mean skip step</th>
                  </tr>
                </thead>
                <tbody>
                  {TOUR_CATALOG.map((entry) => {
                    const t = getTelemetry(entry.id);
                    return (
                      <tr key={entry.id} className="border-t">
                        <td className="px-3 py-2 font-mono">{entry.id}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{t.completedCount}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{t.skipCount}</td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {t.meanSkipStep === null ? '—' : t.meanSkipStep.toFixed(1)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Tip: append <code>?tour-debug=1</code> to any URL to highlight every{' '}
              <code className="text-xs">data-tour</code> element on the page.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Available tours</CardTitle>
          <CardDescription>Re-run a tour at any time, even if you've already completed it.</CardDescription>
        </CardHeader>
        <CardContent>
          {TOUR_CATALOG.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center">
              <Sparkles className="mx-auto mb-2 h-6 w-6 text-muted-foreground" aria-hidden />
              <p className="text-sm font-medium">No tours yet</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Tours roll out across the app over the next few releases. The engine is ready — they'll appear here as
                we ship them.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {TOUR_CATALOG.map((entry) => {
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
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
