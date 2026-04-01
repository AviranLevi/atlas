// React / library
import { ListChecks } from 'lucide-react';

// Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Lib
import { timeAgo } from '@/lib/format';

// Types
import type { Task } from '@atlas/shared';
import type { ProjectTasksTableProps } from './project-detail-page.types';

// Constants
import { taskStatusConfig, priorityBadgeClass } from './project-detail-page.constants';

export function ProjectTasksTable({ tasks, onNavigateToKanban }: ProjectTasksTableProps) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListChecks className="text-muted-foreground h-4 w-4" />
          <h2 className="text-sm font-semibold">Tasks ({tasks.length})</h2>
        </div>
        <Button variant="outline" size="sm" onClick={onNavigateToKanban}>
          Open in Kanban
        </Button>
      </div>

      {tasks.length === 0 ? (
        <p className="text-muted-foreground text-xs">No tasks for this project yet.</p>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="hidden px-3 py-2 font-medium sm:table-cell">Priority</th>
                <th className="hidden px-3 py-2 font-medium md:table-cell">Estimate</th>
                <th className="hidden px-3 py-2 font-medium lg:table-cell">Tags</th>
                <th className="px-3 py-2 text-right font-medium">Age</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task: Task) => {
                const ts = taskStatusConfig[task.status];
                return (
                  <tr key={task.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="max-w-[240px] truncate px-3 py-2 font-medium">{task.name}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center gap-1 text-xs ${ts?.className ?? ''}`}>
                        {ts?.icon}
                        {task.status}
                      </span>
                    </td>
                    <td className="hidden px-3 py-2 sm:table-cell">
                      <Badge
                        variant="outline"
                        className={`text-xs ${priorityBadgeClass[task.priority ?? 'Medium'] ?? ''}`}
                      >
                        {task.priority}
                      </Badge>
                    </td>
                    <td className="hidden px-3 py-2 md:table-cell">
                      <Badge variant="outline" className="text-xs">
                        {task.estimate}
                      </Badge>
                    </td>
                    <td className="hidden px-3 py-2 lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {task.tags?.map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-[10px]">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="text-muted-foreground px-3 py-2 text-right text-xs">{timeAgo(task.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
