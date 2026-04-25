// Components
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProjectCreateBody } from './ProjectCreateBody';

// Types
import type { ProjectCreateDialogProps } from './projects.types';

export function ProjectCreateDialog({ open, onOpenChange, onCreated }: ProjectCreateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
          <DialogDescription>
            Choose how you want to set up the project. You can edit the rest of the metadata later.
          </DialogDescription>
        </DialogHeader>
        <ProjectCreateBody
          onCancel={() => onOpenChange(false)}
          onCreated={(p) => {
            onOpenChange(false);
            onCreated?.(p);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
