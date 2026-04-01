// Types
import type { Project } from '@atlas/shared';

export type ScanResult = {
  name: string | null;
  description: string | null;
  techStack: string | null;
  repositoryUrl: string | null;
  defaultBranch: string | null;
  packageManager: string | null;
  cicd: string | null;
  monorepo: boolean;
  githubOwner: string | null;
  githubRepo: string | null;
};

export type DirectoryEntry = {
  name: string;
  path: string;
  isGitRepo: boolean;
};

export type BrowseResponse = {
  currentPath: string;
  parentPath: string | null;
  directories: DirectoryEntry[];
  isGitRepo: boolean;
};

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
