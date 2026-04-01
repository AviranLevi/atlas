// React / library
import { Pencil, Trash2, Users } from 'lucide-react';

// Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Lib
import { timeAgo } from '@/lib/format';

// Types
import type { ProjectStatus } from '@atlas/shared';
import type { ProjectCardProps } from './projects-page.types';

// Constants
import { statusConfig } from './projects-page.constants';

export function ProjectCard({ project, onEdit, onDelete, onNavigate }: ProjectCardProps) {
  const status = statusConfig[project.status as ProjectStatus] ?? statusConfig.active;
  const { taskCounts, agentCount } = project;
  const doneRatio = taskCounts.total > 0 ? Math.round((taskCounts.done / taskCounts.total) * 100) : 0;

  return (
    <Card
      className="group relative flex cursor-pointer flex-col gap-2 p-4 transition-shadow hover:shadow-md"
      style={{ borderLeftWidth: 3, borderLeftColor: project.color ?? 'transparent' }}
      onClick={() => onNavigate(project.id)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold">{project.name}</h3>
          {project.description && (
            <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs leading-relaxed">{project.description}</p>
          )}
        </div>
        <Badge variant="outline" className={`shrink-0 text-[10px] ${status.className}`}>
          {status.label}
        </Badge>
      </div>

      {project.techStack && (
        <div className="flex flex-wrap gap-1">
          {project.techStack
            .split(',')
            .map((tech) => tech.trim())
            .filter(Boolean)
            .slice(0, 4)
            .map((tech) => (
              <Badge key={tech} variant="secondary" className="text-[10px]">
                {tech}
              </Badge>
            ))}
        </div>
      )}

      <div className="mt-auto flex flex-col gap-1.5 pt-1">
        {taskCounts.total > 0 && (
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${doneRatio}%` }} />
            </div>
            <span className="text-muted-foreground shrink-0 text-[10px]">
              {taskCounts.done}/{taskCounts.total}
            </span>
          </div>
        )}
        <div className="text-muted-foreground flex items-center justify-between text-[10px]">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" />
            {agentCount} agent{agentCount !== 1 ? 's' : ''}
          </span>
          <span>{timeAgo(project.updatedAt)}</span>
        </div>
      </div>

      <div className="absolute right-2 top-2 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => onEdit(e, project)}
          aria-label="Edit project"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => onDelete(e, project.id)}
          aria-label="Delete project"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  );
}
