// React / library
import { Loader2, Plus, Server } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

// Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Hooks
import {
  useCreateMcpServer,
  useDeleteMcpServer,
  useMcpServers,
  useUpdateMcpServer,
} from '@/hooks/use-mcp-servers.hook';

// Types
import type { McpServer } from '@atlas/shared';

// Local
import { DeleteMcpServerDialog } from './DeleteMcpServerDialog';
import { McpServerFormRow } from './McpServerFormRow';
import { McpServerRow } from './McpServerRow';
import {
  type McpServerFormState,
  displayArgsToJson,
  displayEnvToJson,
  emptyMcpServerForm,
  serverToForm,
} from './mcp-servers.helpers';

export function McpServersTab() {
  const { data: servers = [], isLoading, isError, error, refetch } = useMcpServers();
  const createServer = useCreateMcpServer();
  const updateServer = useUpdateMcpServer();
  const deleteServer = useDeleteMcpServer();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<McpServerFormState>(emptyMcpServerForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const isSaving = createServer.isPending || updateServer.isPending;
  const isFormValid = Boolean(form.name.trim() && form.command.trim());

  const resetForm = () => {
    setForm(emptyMcpServerForm());
    setEditingId(null);
  };

  const handleAdd = () => {
    setForm(emptyMcpServerForm());
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
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="min-w-0">
            <CardTitle>MCP Servers</CardTitle>
            <CardDescription>
              Configure additional MCP servers that are injected into CLI agents when they are spawned.
            </CardDescription>
          </div>
          <Button className="shrink-0" onClick={handleAdd} disabled={editingId === 'new'}>
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
                  <McpServerRow
                    key={server.id}
                    server={server}
                    toggleDisabled={updateServer.isPending}
                    editDisabled={editingId !== null}
                    onToggleEnabled={handleToggleEnabled}
                    onEdit={handleEdit}
                    onRequestDelete={setDeleteId}
                  />
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

      <DeleteMcpServerDialog
        open={!!deleteId}
        isDeleting={deleteServer.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleteId(null)}
      />
    </>
  );
}
