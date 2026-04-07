// React / library
import { FileText, RefreshCw } from 'lucide-react';

// Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Types
import type { ProjectBriefSectionProps } from '../project-detail.types';

export function ProjectBriefSection({ project, generateBrief }: ProjectBriefSectionProps) {
  if (project.projectBrief) {
    return (
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="text-muted-foreground h-4 w-4" />
            <h2 className="text-sm font-semibold">Project Brief</h2>
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              auto-generated for agents
            </Badge>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <button type="button" onClick={() => generateBrief.mutate(project.id)} disabled={generateBrief.isPending}>
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${generateBrief.isPending ? 'animate-spin' : ''}`} />
              {generateBrief.isPending ? 'Regenerating...' : 'Regenerate'}
            </button>
          </Button>
        </div>
        <Card className="p-4">
          <pre className="whitespace-pre-wrap text-xs font-mono text-muted-foreground leading-relaxed max-h-64 overflow-y-auto">
            {project.projectBrief}
          </pre>
        </Card>
      </section>
    );
  }

  if (project.scanData) {
    return (
      <Card className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Generate Project Brief</p>
            <p className="text-muted-foreground text-xs">
              Compress scan data and memories into a compact brief for agents.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <button type="button" onClick={() => generateBrief.mutate(project.id)} disabled={generateBrief.isPending}>
            <FileText className={`mr-1.5 h-4 w-4 ${generateBrief.isPending ? 'animate-pulse' : ''}`} />
            {generateBrief.isPending ? 'Generating...' : 'Generate Brief'}
          </button>
        </Button>
      </Card>
    );
  }

  return null;
}
