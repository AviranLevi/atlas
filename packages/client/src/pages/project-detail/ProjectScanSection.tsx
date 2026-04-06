// React / library
import { ScanSearch } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DetectedRulesSection } from './DetectedRulesSection';
import { ScanDataSection } from './ScanDataSection';

// Lib
import { timeAgo } from '@/lib/format';

// Types
import type { ProjectScanSectionProps } from './project-detail-page.types';

export function ProjectScanSection({ project, scanProject }: ProjectScanSectionProps) {
  if (project.scanData) {
    return (
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScanSearch className="text-muted-foreground h-4 w-4" />
            <h2 className="text-sm font-semibold">Project Intelligence</h2>
          </div>
          {project.scanData.scannedAt && (
            <span className="text-muted-foreground text-xs">Scanned {timeAgo(project.scanData.scannedAt)}</span>
          )}
        </div>
        <ScanDataSection scanData={project.scanData} />
        {project.scanData.aiConfigs && project.scanData.aiConfigs.length > 0 && (
          <div className="mt-4">
            <DetectedRulesSection projectId={project.id} aiConfigs={project.scanData.aiConfigs} />
          </div>
        )}
      </section>
    );
  }

  if (project.localPath) {
    return (
      <Card className="flex flex-col items-center gap-3 p-8 border-dashed">
        <ScanSearch className="h-8 w-8 text-muted-foreground" />
        <div className="text-center">
          <p className="font-medium text-sm">No project scan data yet</p>
          <p className="text-muted-foreground text-xs mt-1">
            Scan your project to detect tech stack, dependencies, directory structure, and more.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <button type="button" onClick={() => scanProject.mutate(project.id)} disabled={scanProject.isPending}>
            <ScanSearch className={`mr-1.5 h-4 w-4 ${scanProject.isPending ? 'animate-pulse' : ''}`} />
            {scanProject.isPending ? 'Scanning...' : 'Scan Project'}
          </button>
        </Button>
      </Card>
    );
  }

  return null;
}
