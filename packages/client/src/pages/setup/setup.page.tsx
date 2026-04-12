// React / library
import { Key, Copy, ArrowRight, Check } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Hooks
import { useSetupApiKey } from '@/hooks/use-auth.hook';

// Context
import { useAuth } from '@/contexts/auth.context';

export function SetupPage() {
  const navigate = useNavigate();
  const { setKey } = useAuth();
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

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Key className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome to Atlas</CardTitle>
          <CardDescription>Generate your API key to get started</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!rawKey ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="key-name">Key Name</Label>
                <Input
                  id="key-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. My Laptop"
                />
              </div>
              <Button className="w-full" onClick={handleGenerate} disabled={setupMutation.isPending || !name.trim()}>
                {setupMutation.isPending ? 'Generating...' : 'Generate My Key'}
              </Button>
              {setupMutation.error && (
                <p className="text-sm text-destructive">{(setupMutation.error as Error).message}</p>
              )}
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Your API Key</Label>
                <div className="flex gap-2">
                  <Input readOnly value={rawKey} className="font-mono text-xs" />
                  <Button variant="outline" size="icon" onClick={handleCopy}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Save this key — it will not be shown again.
                </p>
              </div>
              <Button className="w-full" onClick={() => navigate('/')}>
                Continue to Atlas
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
