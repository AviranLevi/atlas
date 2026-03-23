import type { ProjectWithSummary } from '@/hooks/use-projects.hook';

export type ProjectCardProps = {
  project: ProjectWithSummary;
  onEdit: (e: React.MouseEvent, project: ProjectWithSummary) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  onNavigate: (id: string) => void;
};
