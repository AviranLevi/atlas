// React / library
import { ArrowLeft, ExternalLink, Pencil, GitBranch, ScanSearch } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Types
import type { ProjectHeaderProps } from '../project-detail.types';

export function ProjectHeader({ project, statusConfig: status, scanProject, onEdit }: ProjectHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-4">
      <Button variant="ghost" size="sm" className="w-fit" onClick={() => navigate('/projects')}>
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        Back to Projects
      </Button>

      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {project.color && (
            <div className="mt-1.5 h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: project.color }} />
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
              <Badge variant="outline" className={status.className}>
                {status.label}
              </Badge>
              {project.scanData?.projectType && (
                <Badge variant="secondary" className="capitalize text-xs">
                  {project.scanData.projectType}
                </Badge>
              )}
            </div>
            {project.description && <p className="text-muted-foreground mt-1 text-sm">{project.description}</p>}
            {project.mission && <p className="text-muted-foreground/80 mt-1 text-xs italic">{project.mission}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {project.techStack
                ?.split(',')
                .map((t) => t.trim())
                .filter(Boolean)
                .map((tech) => (
                  <Badge key={tech} variant="secondary" className="text-xs">
                    {tech}
                  </Badge>
                ))}
              {project.defaultBranch && (
                <Badge variant="outline" className="text-xs gap-1">
                  <GitBranch className="h-3 w-3" />
                  {project.defaultBranch}
                </Badge>
              )}
              {project.repositoryUrl && (
                <a
                  href={project.repositoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Repository
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {project.localPath && (
            <Button variant="outline" size="sm" asChild>
              <button type="button" onClick={() => scanProject.mutate(project.id)} disabled={scanProject.isPending}>
                <ScanSearch className={`mr-1.5 h-4 w-4 ${scanProject.isPending ? 'animate-pulse' : ''}`} />
                {scanProject.isPending ? 'Scanning...' : project.scanData ? 'Re-scan' : 'Scan Project'}
              </button>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="mr-1.5 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>
    </div>
  );
}
