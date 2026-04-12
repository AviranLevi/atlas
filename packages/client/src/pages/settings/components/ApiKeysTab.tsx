// React / library
import { Copy, Key, Plus, Trash2, Check } from 'lucide-react';
import { useState } from 'react';

// Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// Hooks
import { useApiKeys, useCreateApiKey, useDeleteApiKey } from '@/hooks/use-auth.hook';

// Lib
import { timeAgo } from '@/lib/format';

export function ApiKeysTab() {
  const { data: keys = [], isLoading } = useApiKeys();
  const createKey = useCreateApiKey();
  const deleteKey = useDeleteApiKey();
  const [newKeyName, setNewKeyName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newRawKey, setNewRawKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = () => {
    createKey.mutate(newKeyName, {
      onSuccess: (data) => {
        setNewRawKey(data.rawKey);
        setNewKeyName('');
      },
    });
  };

  const handleCopy = async () => {
    if (!newRawKey) return;
    await navigator.clipboard.writeText(newRawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">API Keys</CardTitle>
              <CardDescription>Manage keys for remote access to your Atlas instance</CardDescription>
            </div>
            <Button size="sm" onClick={() => { setShowCreate(true); setNewRawKey(null); }}>
              <Plus className="mr-1.5 h-4 w-4" />
              New Key
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showCreate && (
            <div className="rounded-lg border p-4 space-y-3">
              {!newRawKey ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="Key name..."
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                  <Button onClick={handleCreate} disabled={createKey.isPending || !newKeyName.trim()}>
                    {createKey.isPending ? 'Creating...' : 'Create'}
                  </Button>
                  <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input readOnly value={newRawKey} className="font-mono text-xs" />
                    <Button variant="outline" size="icon" onClick={handleCopy}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Save this key now — it will not be shown again.
                  </p>
                  <Button variant="outline" size="sm" onClick={() => { setShowCreate(false); setNewRawKey(null); }}>
                    Done
                  </Button>
                </div>
              )}
            </div>
          )}

          {isLoading && <p className="text-sm text-muted-foreground">Loading keys...</p>}

          {keys.length === 0 && !isLoading && (
            <p className="text-sm text-muted-foreground">No API keys yet.</p>
          )}

          {keys.map((key) => (
            <div key={key.id} className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <Key className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{key.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{key.keyPrefix}…</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {key.lastUsedAt ? `Used ${timeAgo(key.lastUsedAt)}` : 'Never used'}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteKey.mutate(key.id)}
                  disabled={deleteKey.isPending}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
