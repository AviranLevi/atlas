import { useState } from 'react';
import type { ReactNode } from 'react';
import { Download } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useResetAllData } from '@/hooks/use-system.hook';

function ActionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export function DataManagementTab() {
  const [resetOpen, setResetOpen] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const resetMutation = useResetAllData();

  const handleExport = () => {
    window.open('/api/v1/system/export', '_blank');
  };

  const handleConfirmReset = () => {
    setResetError(null);
    resetMutation.mutate(undefined, {
      onSuccess: () => window.location.reload(),
      onError: (e: unknown) =>
        setResetError(e instanceof Error ? e.message : 'Reset failed'),
    });
  };

  return (
    <div className="space-y-6">
      <ActionCard
        title="Export Database"
        description="Download a snapshot of the local SQLite database for backup or migration."
      >
        <Button type="button" variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
      </ActionCard>

      <ActionCard
        title="Import Database"
        description="Restore from a previously exported database file. This will replace all current data."
      >
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept=".sqlite,.db,application/octet-stream"
            disabled
            className="text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50"
          />
          <Badge variant="secondary">Coming Soon</Badge>
        </div>
      </ActionCard>

      <ActionCard
        title="Reset All Data"
        description="Permanently delete agents, tasks, workspaces, and all other stored data. This cannot be undone."
      >
        <Button type="button" variant="destructive" onClick={() => setResetOpen(true)}>
          Reset all data
        </Button>
      </ActionCard>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset all data?</DialogTitle>
            <DialogDescription>
              Are you sure? This will permanently delete all data.
            </DialogDescription>
          </DialogHeader>
          {resetError && <p className="text-sm text-destructive">{resetError}</p>}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setResetOpen(false)}
              disabled={resetMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmReset}
              disabled={resetMutation.isPending}
            >
              {resetMutation.isPending ? 'Resetting…' : 'Delete everything'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
