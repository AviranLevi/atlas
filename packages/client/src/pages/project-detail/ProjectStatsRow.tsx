// React / library
import { useMemo } from 'react';

// Components
import { Card } from '@/components/ui/card';

// Types
import type { ProjectStatsRowProps } from './project-detail-page.types';

const STAT_COLUMNS = [
  { status: 'To Do', color: 'text-muted-foreground' },
  { status: 'In Progress', color: 'text-blue-600 dark:text-blue-400' },
  { status: 'In Review', color: 'text-yellow-600 dark:text-yellow-400' },
  { status: 'Done', color: 'text-green-600 dark:text-green-400' },
] as const;

export function ProjectStatsRow({ tasks }: ProjectStatsRowProps) {
  const countByStatus = useMemo(
    () =>
      tasks.reduce(
        (acc, t) => {
          acc[t.status] = (acc[t.status] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    [tasks],
  );

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {STAT_COLUMNS.map((col) => (
        <Card key={col.status} className="flex flex-col items-center gap-1 p-4">
          <span className={`text-2xl font-bold ${col.color}`}>{countByStatus[col.status] ?? 0}</span>
          <span className="text-muted-foreground text-xs">{col.status}</span>
        </Card>
      ))}
    </div>
  );
}
