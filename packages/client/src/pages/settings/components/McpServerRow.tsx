// React / library
import { Pencil, Trash2 } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

// Types
import type { McpServer } from '@atlas/shared';

type McpServerRowProps = {
  server: McpServer;
  toggleDisabled: boolean;
  editDisabled: boolean;
  onToggleEnabled: (server: McpServer, enabled: boolean) => void;
  onEdit: (server: McpServer) => void;
  onRequestDelete: (id: string) => void;
};

export function McpServerRow({
  server,
  toggleDisabled,
  editDisabled,
  onToggleEnabled,
  onEdit,
  onRequestDelete,
}: McpServerRowProps) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto_auto] items-center gap-4 border-b px-4 py-3 last:border-b-0">
      <div className="truncate text-sm font-medium" title={server.name}>
        {server.name}
      </div>
      <div className="truncate font-mono text-xs text-muted-foreground" title={server.command}>
        {server.command}
      </div>
      <div className="flex justify-center">
        <Switch
          checked={server.enabled}
          onCheckedChange={(v: boolean) => onToggleEnabled(server, v)}
          disabled={toggleDisabled}
          aria-label={server.enabled ? 'Disable server' : 'Enable server'}
        />
      </div>
      <div className="flex gap-1 justify-end">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onEdit(server)}
          disabled={editDisabled}
          aria-label="Edit server"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={() => onRequestDelete(server.id)} aria-label="Delete server">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
