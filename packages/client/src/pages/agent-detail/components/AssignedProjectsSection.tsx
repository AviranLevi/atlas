// React / library
import { FolderOpen, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Components
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

// Types
import type { AssignedProjectsSectionProps } from '../agent-detail.types';

export function AssignedProjectsSection({ projects }: AssignedProjectsSectionProps) {
  const navigate = useNavigate();

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <FolderOpen className="text-muted-foreground h-4 w-4" />
        <h2 className="text-sm font-semibold">Assigned Projects ({projects.length})</h2>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <FolderOpen className="text-muted-foreground mx-auto mb-2 h-6 w-6" />
          <p className="text-muted-foreground text-xs">Not assigned to any projects yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="flex cursor-pointer items-center justify-between p-3 transition-shadow hover:shadow-md"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate text-sm font-medium">{project.name}</span>
                <Badge variant="outline" className="text-[10px] capitalize">
                  {project.status}
                </Badge>
              </div>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
