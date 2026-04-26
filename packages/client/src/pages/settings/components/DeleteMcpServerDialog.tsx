// Components
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type DeleteMcpServerDialogProps = {
  open: boolean;
  isDeleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function DeleteMcpServerDialog({ open, isDeleting, onConfirm, onClose }: DeleteMcpServerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete MCP server</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this MCP server? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
