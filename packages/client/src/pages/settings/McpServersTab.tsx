// React / library
import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Server, Loader2 } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Hooks
import {
  useMcpServers,
  useCreateMcpServer,
  useUpdateMcpServer,
  useDeleteMcpServer,
} from '@/hooks/use-mcp-servers.hook';

// Types
import type { McpServer } from '@atlas/shared';

type McpServerFormState = {
  name: string;
  command: string;
  argsStr: string;
  envStr: string;
  enabled: boolean;
};

const emptyForm = (): McpServerFormState => ({
  name: '',
  command: '',
  argsStr: '',
  envStr: '',
  enabled: true,
});

function argsToDisplay(args: string | null): string {
  if (!args?.trim()) return '';
  try {
    const parsed = JSON.parse(args) as unknown;
    if (Array.isArray(parsed)) return parsed.map(String).join(', ');
    return '';
  } catch {
    return '';
  }
}

function envToDisplay(env: string | null): string {
  if (!env?.trim()) return '';
  try {
    const parsed = JSON.parse(env) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return Object.entries(parsed as Record<string, string>)
        .map(([k, v]) => `${k}=${String(v)}`)
        .join('\n');
    }
    return '';
  } catch {
    return '';
  }
}

function displayArgsToJson(argsStr: string): string {
  return JSON.stringify(
    argsStr.split(',').map((a) => a.trim()).filter(Boolean),
  );
}

function displayEnvToJson(envStr: string): string {
  const obj: Record<string, string> = {};
  for (const line of envStr.split('\n')) {
    const t = line.trim();
    if (!t) continue;
    const eq = t.indexOf('=');
    if (eq <= 0) continue;
    obj[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
  return JSON.stringify(obj);
}

function serverToForm(server: McpServer): McpServerFormState {
  return {
    name: server.name,
    command: server.command,
    argsStr: argsToDisplay(server.args),
    envStr: envToDisplay(server.env),
    enabled: server.enabled,
  };
}

type McpServerFormRowProps = {
  form: McpServerFormState;
  isSaving: boolean;
  isValid: boolean;
  onChange: (next: McpServerFormState) => void;
  onSave: () => void;
  onCancel: () => void;
};

function McpServerFormRow({
  form,
  isSaving,
  isValid,
  onChange,
  onSave,
  onCancel,
}: McpServerFormRowProps) {
  return (
    <div className="space-y-4 border-b px-4 py-4 last:border-b-0">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="mcp-name">Name</Label>
          <Input
            id="mcp-name"
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
            placeholder="e.g. my-tool"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mcp-command">Command</Label>
          <Input
            id="mcp-command"
            value={form.command}
            onChange={(e) => onChange({ ...form, command: e.target.value })}
            placeholder="e.g. npx"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="mcp-args">Args (comma-separated)</Label>
        <Input
          id="mcp-args"
          value={form.argsStr}
          onChange={(e) => onChange({ ...form, argsStr: e.target.value })}
          placeholder="-y, @scope/mcp-server"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="mcp-env">Environment (one KEY=value per line)</Label>
        <Textarea
          id="mcp-env"
          value={form.envStr}
          onChange={(e) => onChange({ ...form, envStr: e.target.value })}
          placeholder="API_KEY=..."
          rows={4}
          className="font-mono text-sm"
        />
      </div>
      <div className="flex items-center gap-2">
        <Switch
          id="mcp-enabled"
          checked={form.enabled}
          onCheckedChange={(checked: boolean) => onChange({ ...form, enabled: checked })}
        />
        <Label htmlFor="mcp-enabled" className="text-sm font-normal">
          Enabled
        </Label>
      </div>
      <div className="flex gap-2">
        <Button type="button" onClick={onSave} disabled={isSaving || !isValid}>
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export function McpServersTab() {
  const { data: servers = [], isLoading, isError, error, refetch } = useMcpServers();
  const createServer = useCreateMcpServer();
  const updateServer = useUpdateMcpServer();
  const deleteServer = useDeleteMcpServer();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<McpServerFormState>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const isSaving = createServer.isPending || updateServer.isPending;
  const isFormValid = Boolean(form.name.trim() && form.command.trim());

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
  };

  const handleAdd = () => {
    setForm(emptyForm());
    setEditingId('new');
  };

  const handleEdit = (server: McpServer) => {
    setForm(serverToForm(server));
    setEditingId(server.id);
  };

  const handleSave = () => {
    if (!isFormValid) return;
    const argsJson = displayArgsToJson(form.argsStr);
    const envJson = displayEnvToJson(form.envStr);

    if (editingId === 'new') {
      createServer.mutate(
        {
          name: form.name.trim(),
          command: form.command.trim(),
          args: argsJson,
          env: envJson,
          enabled: form.enabled,
        },
        {
          onSuccess: () => {
            toast.success('MCP server created');
            resetForm();
          },
          onError: (err) => toast.error(err.message ?? 'Failed to create server'),
        },
      );
      return;
    }

    if (editingId) {
      updateServer.mutate(
        {
          id: editingId,
          data: {
            name: form.name.trim(),
            command: form.command.trim(),
            args: argsJson,
            env: envJson,
            enabled: form.enabled,
          },
        },
        {
          onSuccess: () => {
            toast.success('MCP server updated');
            resetForm();
          },
          onError: (err) => toast.error(err.message ?? 'Failed to update server'),
        },
      );
    }
  };

  const handleToggleEnabled = (server: McpServer, enabled: boolean) => {
    updateServer.mutate(
      { id: server.id, data: { enabled } },
      {
        onSuccess: () => toast.success(enabled ? 'Server enabled' : 'Server disabled'),
        onError: (err) => toast.error(err.message ?? 'Failed to update'),
      },
    );
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteServer.mutate(deleteId, {
      onSuccess: () => {
        toast.success('MCP server deleted');
        setDeleteId(null);
      },
      onError: (err) => toast.error(err.message ?? 'Failed to delete server'),
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle>MCP Servers</CardTitle>
            <CardDescription>
              Configure additional MCP servers that are injected into CLI agents when they are spawned.
            </CardDescription>
          </div>
          <Button onClick={handleAdd} disabled={editingId === 'new'}>
            <Plus className="mr-2 h-4 w-4" />
            Add Server
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="text-muted-foreground rounded-md border border-dashed px-4 py-6 text-center text-sm">
              <p className="text-destructive mb-2">{error?.message ?? 'Failed to load MCP servers'}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto_auto] gap-4 border-b bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground">
                <div>Name</div>
                <div>Command</div>
                <div>Enabled</div>
                <div />
              </div>

              {servers.map((server) =>
                editingId === server.id ? (
                  <McpServerFormRow
                    key={server.id}
                    form={form}
                    isSaving={isSaving}
                    isValid={isFormValid}
                    onChange={setForm}
                    onSave={handleSave}
                    onCancel={resetForm}
                  />
                ) : (
                  <div
                    key={server.id}
                    className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto_auto] items-center gap-4 border-b px-4 py-3 last:border-b-0"
                  >
                    <div className="truncate text-sm font-medium" title={server.name}>
                      {server.name}
                    </div>
                    <div className="truncate font-mono text-xs text-muted-foreground" title={server.command}>
                      {server.command}
                    </div>
                    <div className="flex justify-center">
                      <Switch
                        checked={server.enabled}
                        onCheckedChange={(v: boolean) => handleToggleEnabled(server, v)}
                        disabled={updateServer.isPending}
                        aria-label={server.enabled ? 'Disable server' : 'Enable server'}
                      />
                    </div>
                    <div className="flex gap-1 justify-end">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(server)}
                        disabled={editingId !== null}
                        aria-label="Edit server"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleteId(server.id)}
                        aria-label="Delete server"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ),
              )}

              {editingId === 'new' && (
                <McpServerFormRow
                  form={form}
                  isSaving={isSaving}
                  isValid={isFormValid}
                  onChange={setForm}
                  onSave={handleSave}
                  onCancel={resetForm}
                />
              )}

              {servers.length === 0 && editingId !== 'new' && (
                <div className="text-muted-foreground flex flex-col items-center gap-2 px-4 py-10 text-center text-sm">
                  <Server className="h-8 w-8 opacity-50" />
                  <p>No MCP servers configured. Add a server to extend CLI agents.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete MCP server</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this MCP server? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteServer.isPending}
            >
              {deleteServer.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
