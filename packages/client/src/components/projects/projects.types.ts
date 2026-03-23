import type { Project } from '@my-agents/shared';

export type { ScanResult, BrowseResponse, DirectoryEntry } from '@/hooks/use-projects.hook';

export type ProjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project;
};

export type FolderPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPath?: string;
  onSelect: (path: string) => void;
};
