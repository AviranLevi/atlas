// React / library
import { ArrowRight, Check, Copy, Key } from 'lucide-react';
import { useState } from 'react';

// Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Context
import { useAuth } from '@/contexts/auth.context';

// Hooks
import { useSetupApiKey } from '@/hooks/use-auth.hook';

type ApiKeyStepProps = {
  /**
   * Called once the user has copied/acknowledged the key. The key persists in
   * `localStorage` regardless — this is purely a UX progression callback.
   */
  onContinue: () => void;
  /** Continue button label. Defaults to "Continue". */
  continueLabel?: string;
  /** Hide the surrounding Card chrome — useful when embedded inside another panel. */
  bare?: boolean;
};

export function ApiKeyStep({ onContinue, continueLabel = 'Continue', bare }: ApiKeyStepProps) {
  const { setKey, isAuthenticated } = useAuth();
  const setupMutation = useSetupApiKey();
  const [name, setName] = useState('Default');
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    setupMutation.mutate(name, {
      onSuccess: (data) => {
        setRawKey(data.rawKey);
        setKey(data.rawKey);
      },
    });
  };

  const handleCopy = async () => {
    if (!rawKey) return;
    await navigator.clipboard.writeText(rawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const body = (
    <CardContent className="space-y-4">
      {!rawKey && !isAuthenticated ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="key-name">Key Name</Label>
            <Input id="key-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. My Laptop" />
          </div>
          <Button className="w-full" onClick={handleGenerate} disabled={setupMutation.isPending || !name.trim()}>
            {setupMutation.isPending ? 'Generating...' : 'Generate My Key'}
          </Button>
          {setupMutation.error && <p className="text-sm text-destructive">{(setupMutation.error as Error).message}</p>}
        </>
      ) : (
        <>
          {rawKey && (
            <div className="space-y-2">
              <Label>Your API Key</Label>
              <div className="flex gap-2">
                <Input readOnly value={rawKey} className="font-mono text-xs" />
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-400">Save this key — it will not be shown again.</p>
            </div>
          )}
          {!rawKey && isAuthenticated && (
            <p className="text-muted-foreground text-sm">
              You're already authenticated. Click continue to set up your first project.
            </p>
          )}
          <Button className="w-full" onClick={onContinue}>
            {continueLabel}
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </>
      )}
    </CardContent>
  );

  if (bare) return <div className="space-y-4">{body}</div>;

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Key className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Welcome to Atlas</CardTitle>
        <CardDescription>Generate your API key to get started</CardDescription>
      </CardHeader>
      {body}
    </Card>
  );
}
