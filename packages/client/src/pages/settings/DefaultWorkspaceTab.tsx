import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  usePreferences,
  useUpdatePreferences,
} from '@/hooks/use-preferences.hook';
import { useAgentRuntimes } from '@/hooks/use-workspaces.hook';

const DEFAULT_EXECUTOR_KEY = 'defaultExecutorId';
const BRANCH_PATTERN_KEY = 'defaultBranchPattern';

export function DefaultWorkspaceTab() {
  const { data: prefs, isLoading: prefsLoading } = usePreferences();
  const { data: runtimes = [], isLoading: runtimesLoading } = useAgentRuntimes();
  const updatePrefs = useUpdatePreferences();

  const [executorId, setExecutorId] = useState('');
  const [branchPattern, setBranchPattern] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (!prefs) return;
    setExecutorId(prefs[DEFAULT_EXECUTOR_KEY] ?? '');
    setBranchPattern(prefs[BRANCH_PATTERN_KEY] ?? '');
  }, [prefs]);

  const savedExecutor = prefs?.[DEFAULT_EXECUTOR_KEY] ?? '';
  const savedBranch = prefs?.[BRANCH_PATTERN_KEY] ?? '';
  const dirty =
    executorId !== savedExecutor || branchPattern !== savedBranch;

  const eligibleRuntimes = runtimes.filter((r) => r.installed && r.authenticated);

  const handleSave = () => {
    const next = { ...(prefs ?? {}), [DEFAULT_EXECUTOR_KEY]: executorId, [BRANCH_PATTERN_KEY]: branchPattern };
    updatePrefs.mutate(next, {
      onSuccess: () => {
        setSavedFlash(true);
        window.setTimeout(() => setSavedFlash(false), 2000);
      },
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
        <p className="text-sm text-muted-foreground">
          Template for Git branch names when creating workspace branches.
        </p>
        <Input
          className="max-w-md font-mono text-sm"
          placeholder="agents/{agent}/{task}"
          value={branchPattern}
          onChange={(e) => setBranchPattern(e.target.value)}
          disabled={prefsLoading}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={handleSave}
          disabled={!dirty || updatePrefs.isPending || prefsLoading}
        >
          {updatePrefs.isPending ? 'Saving…' : 'Save'}
        </Button>
        {savedFlash && (
          <span className="text-sm text-muted-foreground">Saved.</span>
        )}
        {dirty && !updatePrefs.isPending && !savedFlash && (
          <span className="text-sm text-amber-600 dark:text-amber-500">Unsaved changes</span>
        )}
      </div>
      {updatePrefs.isError && (
        <p className="text-sm text-destructive">{updatePrefs.error.message}</p>
      )}
    </div>
  );
}
