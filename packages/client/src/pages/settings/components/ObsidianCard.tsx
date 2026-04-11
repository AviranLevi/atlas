// React / library
import { BookMarked, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Hooks
import { useIntegration, useObsidianSync, useUpsertIntegration } from '@/hooks/use-integrations.hook';
import { useProjects } from '@/hooks/use-projects.hook';

// Lib
import { cn } from '@/lib/utils';

type ObsidianConfig = {
  vaultPath: string;
  syncFolder: string;
  projectId: string | null;
};

function parseConfig(raw: string | null | undefined): ObsidianConfig {
  if (!raw) return { vaultPath: '', syncFolder: 'Atlas', projectId: null };
  try {
    return JSON.parse(raw) as ObsidianConfig;
  } catch {
    return { vaultPath: '', syncFolder: 'Atlas', projectId: null };
  }
}

export function ObsidianCard() {
  const { data: integration, isLoading } = useIntegration('obsidian');
  const { data: projects } = useProjects();
  const upsert = useUpsertIntegration();
  const sync = useObsidianSync();

  const [vaultPath, setVaultPath] = useState('');
  const [syncFolder, setSyncFolder] = useState('Atlas');
  const [projectId, setProjectId] = useState<string>('__global__');
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (integration) {
      const cfg = parseConfig(integration.config);
      setVaultPath(cfg.vaultPath);
      setSyncFolder(cfg.syncFolder || 'Atlas');
      setProjectId(cfg.projectId ?? '__global__');
      setEnabled(integration.enabled ?? false);
    }
  }, [integration]);

  const savedConfig = parseConfig(integration?.config);
  const isDirty =
    vaultPath !== savedConfig.vaultPath ||
    syncFolder !== (savedConfig.syncFolder || 'Atlas') ||
    (projectId === '__global__' ? null : projectId) !== savedConfig.projectId ||
    enabled !== (integration?.enabled ?? false);

  const handleSave = () => {
    const config: ObsidianConfig = {
      vaultPath: vaultPath.trim(),
      syncFolder: syncFolder.trim() || 'Atlas',
      projectId: projectId === '__global__' ? null : projectId,
    };
    upsert.mutate(
      { name: 'obsidian', data: { enabled, config: JSON.stringify(config) } },
      {
        onSuccess: () => toast.success('Obsidian settings saved'),
        onError: (err) => toast.error(err.message ?? 'Failed to save'),
      },
    );
  };

  const handleSync = () => {
    sync.mutate(undefined, {
      onSuccess: (result) => {
        const parts: string[] = [];
        if (result.imported > 0) parts.push(`${result.imported} imported`);
        if (result.exported > 0) parts.push(`${result.exported} exported`);
        if (parts.length === 0) parts.push('nothing new');
        toast.success(`Sync complete — ${parts.join(', ')}`);
        if (result.errors.length > 0) {
          toast.error(`${result.errors.length} error(s): ${result.errors[0]}`);
        }
      },
      onError: (err) => toast.error(err.message ?? 'Sync failed'),
    });
  };

  if (isLoading) return null;

  return (
    <div className="rounded-lg border border-border p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <BookMarked className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold">Obsidian</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sync vault notes into Atlas memories, and write agent memories back to your vault.
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled((v) => !v)}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            enabled ? 'bg-primary' : 'bg-input',
          )}
        >
          <span
            className={cn(
              'pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg transition-transform',
              enabled ? 'translate-x-5' : 'translate-x-0',
            )}
          />
        </button>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="obs-vault-path" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Vault Path
          </Label>
          <Input
            id="obs-vault-path"
            type="text"
            value={vaultPath}
            onChange={(e) => setVaultPath(e.target.value)}
            placeholder="/Users/you/Documents/Obsidian/MyVault"
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">Absolute path to the root of your Obsidian vault.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="obs-sync-folder" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Sync Folder <span className="normal-case font-normal">(inside vault)</span>
          </Label>
          <Input
            id="obs-sync-folder"
            type="text"
            value={syncFolder}
            onChange={(e) => setSyncFolder(e.target.value)}
            placeholder="Atlas"
            className="text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Notes here import into Atlas. Agent memories are written to{' '}
            <span className="font-mono">{syncFolder || 'Atlas'}/agent-memories/</span>.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="obs-project" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Attach to Project
          </Label>
          <select
            id="obs-project"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="__global__">Global (no project)</option>
            {projects?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">Imported notes become memories for this project.</p>
        </div>
      </div>

      {sync.data && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Last sync: {sync.data.imported} imported, {sync.data.exported} exported
          {sync.data.errors.length > 0 && (
            <span className="text-yellow-500 ml-1">({sync.data.errors.length} error{sync.data.errors.length > 1 ? 's' : ''})</span>
          )}
        </div>
      )}
      {sync.isError && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <XCircle className="h-4 w-4" />
          {sync.error?.message ?? 'Sync failed'}
        </div>
      )}

      <div className="flex items-center gap-3 pt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={sync.isPending || !enabled || !vaultPath.trim()}
          title={!enabled ? 'Enable the integration first' : !vaultPath.trim() ? 'Set a vault path first' : undefined}
        >
          {sync.isPending ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Syncing…
            </>
          ) : (
            'Sync now'
          )}
        </Button>
        <Button size="sm" onClick={handleSave} disabled={!isDirty || upsert.isPending}>
          {upsert.isPending ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  );
}
