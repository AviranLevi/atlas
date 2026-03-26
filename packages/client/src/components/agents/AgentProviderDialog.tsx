import { useEffect, useState } from 'react';
import type { CreateAgentProvider, ProviderType } from '@atlas/shared';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useCreateAgentProvider,
  useUpdateAgentProvider,
  useTestAgentProvider,
} from '@/hooks/use-agent-providers.hook';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import type { AgentProviderDialogProps } from './agents.types';
import { PROVIDER_LABELS, PROVIDER_MODEL_PLACEHOLDERS } from './agents.constants';

export function AgentProviderDialog({ open, onOpenChange, provider }: AgentProviderDialogProps) {
  const createProvider = useCreateAgentProvider();
  const updateProvider = useUpdateAgentProvider();
  const testProvider = useTestAgentProvider();
  const isEditing = !!provider;

  const [name, setName] = useState('');
  const [type, setType] = useState<ProviderType>('anthropic');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [modelName, setModelName] = useState('');
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string } | null>(null);

  useEffect(() => {
    if (provider) {
      setName(provider.name);
      setType(provider.type as ProviderType);
      setApiKey(provider.apiKey ?? '');
      setBaseUrl(provider.baseUrl ?? '');
      setModelName(provider.modelName);
    } else {
      setName('');
      setType('anthropic');
      setApiKey('');
      setBaseUrl('');
      setModelName('');
    }
    setTestResult(null);
  }, [provider, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: CreateAgentProvider = {
      name,
      type,
      apiKey: apiKey || null,
      baseUrl: baseUrl || null,
      modelName,
    };
    if (isEditing) {
      updateProvider.mutate(
        { id: provider.id, data },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createProvider.mutate(data, { onSuccess: () => onOpenChange(false) });
    }
  };

  const handleTest = () => {
    if (!provider) return;
    setTestResult(null);
    testProvider.mutate(provider.id, {
      onSuccess: (result) => setTestResult(result),
    });
  };

  const showBaseUrl = type === 'openai-compatible' || type === 'ollama';
  const showApiKey = type !== 'ollama';
  const isPending = createProvider.isPending || updateProvider.isPending;
  const submitMutation = isEditing ? updateProvider : createProvider;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Provider' : 'New AI Provider'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="provider-name">Name</Label>
            <Input
              id="provider-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., My Claude Setup"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Provider Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as ProviderType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(PROVIDER_LABELS) as [ProviderType, string][]).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
          {showApiKey && (
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
              />
            </div>
          )}
          {showBaseUrl && (
            <div className="space-y-2">
              <Label htmlFor="base-url">Base URL</Label>
              <Input
                id="base-url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder={
                  type === 'ollama'
                    ? 'http://localhost:11434'
                    : 'https://api.your-provider.com/v1'
                }
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="model-name">Model Name</Label>
            <Input
              id="model-name"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder={PROVIDER_MODEL_PLACEHOLDERS[type]}
              required
            />
          </div>

          {isEditing && (
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTest}
                disabled={testProvider.isPending}
              >
                {testProvider.isPending ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : null}
                Test Connection
              </Button>
              {testResult && (
                <span className="flex items-center gap-1.5 text-sm">
                  {testResult.ok ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-green-600">Connected</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-destructive" />
                      <span className="text-destructive">{testResult.error ?? 'Failed'}</span>
                    </>
                  )}
                </span>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name.trim() || !modelName.trim()}>
              {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Provider'}
            </Button>
            {submitMutation.isError && (
              <p className="text-sm text-destructive">{(submitMutation.error as Error).message}</p>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
