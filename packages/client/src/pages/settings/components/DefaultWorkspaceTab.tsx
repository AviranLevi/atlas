// React / library
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Hooks
import { usePreferences, useUpdatePreferences } from '@/hooks/use-preferences.hook';
import { useAgentRuntimes } from '@/hooks/use-workspaces.hook';

const DEFAULT_EXECUTOR_KEY = 'defaultExecutorId';
const BRANCH_PATTERN_KEY = 'defaultBranchPattern';

export function DefaultWorkspaceTab() {
  const { data: prefs, isLoading: prefsLoading } = usePreferences();
  const { data: runtimes = [], isLoading: runtimesLoading } = useAgentRuntimes();
  const updatePrefs = useUpdatePreferences();

  const [executorId, setExecutorId] = useState('');
  const [branchPattern, setBranchPattern] = useState('');

  useEffect(() => {
    if (!prefs) return;
    setExecutorId(prefs[DEFAULT_EXECUTOR_KEY] ?? '');
    setBranchPattern(prefs[BRANCH_PATTERN_KEY] ?? '');
  }, [prefs]);

  const savedExecutor = prefs?.[DEFAULT_EXECUTOR_KEY] ?? '';
  const savedBranch = prefs?.[BRANCH_PATTERN_KEY] ?? '';
  const dirty = executorId !== savedExecutor || branchPattern !== savedBranch;

  const eligibleRuntimes = runtimes.filter((r) => r.installed && r.authenticated);

  const handleSave = () => {
    const next = { ...(prefs ?? {}), [DEFAULT_EXECUTOR_KEY]: executorId, [BRANCH_PATTERN_KEY]: branchPattern };
    updatePrefs.mutate(next, {
      onSuccess: () => toast.success('Settings saved'),
      onError: (err) => toast.error(err.message ?? 'Failed to save settings'),
    });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Default Agent Runtime</h3>
        <p className="text-sm text-muted-foreground">
          Used when starting work from the UI if no runtime is chosen for that action.
        </p>
        <Select
          value={executorId || '__none__'}
          onValueChange={(v) => setExecutorId(v === '__none__' ? '' : v)}
          disabled={prefsLoading || runtimesLoading}
        >
          <SelectTrigger className="max-w-md">
            <SelectValue placeholder="Select a runtime" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">None</SelectItem>
            {eligibleRuntimes.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Default Branch Pattern</h3>
        <p className="text-sm text-muted-foreground">Template for Git branch names when creating workspace branches.</p>
        <Input
          className="max-w-md font-mono text-sm"
          placeholder="agents/{agent}/{task}"
          value={branchPattern}
          onChange={(e) => setBranchPattern(e.target.value)}
          disabled={prefsLoading}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={handleSave} disabled={!dirty || updatePrefs.isPending || prefsLoading}>
          {updatePrefs.isPending ? 'Saving…' : 'Save'}
        </Button>
        {dirty && !updatePrefs.isPending && (
          <span className="text-sm text-amber-600 dark:text-amber-500">Unsaved changes</span>
        )}
      </div>
    </div>
  );
}
