// React / library
import { Brain, CheckCircle2, XCircle, Loader2, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

// Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Hooks
import { useIntegration, useUpsertIntegration, useTestSupermemory } from '@/hooks/use-integrations.hook';

// Lib
import { cn } from '@/lib/utils';

type TestStatus = 'idle' | 'testing' | 'ok' | 'error';

export function IntegrationsTab() {
  const { data: supermemory, isLoading } = useIntegration('supermemory');
  const upsert = useUpsertIntegration();
  const testConnection = useTestSupermemory();

  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testError, setTestError] = useState('');

  useEffect(() => {
    if (supermemory) {
      setApiKey(supermemory.apiKey ?? '');
      setBaseUrl(supermemory.baseUrl ?? '');
      setEnabled(supermemory.enabled ?? false);
    }
  }, [supermemory]);

  const isDirty =
    apiKey !== (supermemory?.apiKey ?? '') ||
    baseUrl !== (supermemory?.baseUrl ?? '') ||
    enabled !== (supermemory?.enabled ?? false);

  const handleSave = () => {
    upsert.mutate(
      { name: 'supermemory', data: { apiKey: apiKey || null, baseUrl: baseUrl || null, enabled } },
      {
        onSuccess: () => toast.success('Supermemory settings saved'),
        onError: (err) => toast.error(err.message ?? 'Failed to save'),
      },
    );
  };

  const handleTest = () => {
    if (!apiKey.trim()) {
      toast.error('Enter an API key first');
      return;
    }
    setTestStatus('testing');
    setTestError('');
    testConnection.mutate(
      { apiKey: apiKey.trim(), baseUrl: baseUrl.trim() || null },
      {
        onSuccess: (result) => {
          if (result.ok) {
            setTestStatus('ok');
          } else {
            setTestStatus('error');
            setTestError(result.error ?? 'Connection failed');
          }
        },
        onError: (err) => {
          setTestStatus('error');
          setTestError(err.message ?? 'Connection failed');
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-semibold">Integrations</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Connect external services to enhance Atlas with additional capabilities.
        </p>
      </div>

      {/* Supermemory card */}
      <div className="rounded-lg border border-border p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">Supermemory</h4>
                <a
                  href="https://supermemory.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Semantic memory layer — gives agents relevant context from past work. Works with all agent CLIs. Open
                source, self-hostable.
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
            <Label htmlFor="sm-api-key" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              API Key
            </Label>
            <Input
              id="sm-api-key"
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setTestStatus('idle');
              }}
              placeholder="sm-••••••••"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Get a free API key at{' '}
              <a
                href="https://supermemory.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                supermemory.ai
              </a>{' '}
              — 1M tokens/month free. Leave blank to use a self-hosted instance.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sm-base-url" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Base URL <span className="normal-case font-normal">(optional, for self-hosted)</span>
            </Label>
            <Input
              id="sm-base-url"
              type="url"
              value={baseUrl}
              onChange={(e) => {
                setBaseUrl(e.target.value);
                setTestStatus('idle');
              }}
              placeholder="https://api.supermemory.ai/v3"
              className="text-sm"
            />
          </div>
        </div>

        {/* Test status */}
        {testStatus === 'ok' && (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            Connected successfully
          </div>
        )}
        {testStatus === 'error' && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <XCircle className="h-4 w-4" />
            {testError || 'Connection failed'}
          </div>
        )}

        <div className="flex items-center gap-3 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={!apiKey.trim() || testStatus === 'testing'}
          >
            {testStatus === 'testing' ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Testing…
              </>
            ) : (
              'Test Connection'
            )}
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!isDirty || upsert.isPending}>
            {upsert.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}
