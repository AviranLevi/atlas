// Types
import type { ImportResolution } from '@atlas/shared';

export type ImportPackageDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
};

/** One resolution per `ImportPreview.items` row, same order and length. */
export type Resolutions = ImportResolution[];
