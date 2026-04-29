// React / library
import { Check, Copy, KeyRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Components
import { Button } from '@/components/ui/button';

// Context
import { useAuth } from '@/contexts/auth.context';

const RECOVERY_COMMAND = 'pnpm --filter @atlas/server reset-auth';

/**
 * Surfaces the two end-states of the silent `/auth/bootstrap` call:
 *
 *   - `justBootstrapped` → success toast that points at Settings → API Keys
 *     so the user can copy the key for use on another device. Toast is
 *     auto-consumed (`acknowledgeBootstrap`) so it never repeats.
 *   - `needsRecovery` → sticky top banner with a copy-to-clipboard recovery
 *     command. Triggered when the server already has keys but this browser
 *     doesn't (cleared localStorage, fresh browser, etc.). The user is
 *     locked out of every protected route until they run the command and
 *     reload, so we show the exact command inline rather than send them
 *     hunting through the README.
 */
export function BootstrapNotifications() {
  const { justBootstrapped, acknowledgeBootstrap, needsRecovery } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!justBootstrapped) return;
    toast.success('Atlas generated an API key. Back it up from Settings → API Keys if you clear browser data.', {
      duration: 8000,
      action: {
        label: 'Open settings',
        onClick: () => navigate('/settings#api-keys'),
      },
    });
    acknowledgeBootstrap();
  }, [justBootstrapped, acknowledgeBootstrap, navigate]);

  if (!needsRecovery) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(RECOVERY_COMMAND);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail in non-secure contexts; the command stays visible.
    }
  };

  return (
    <div
      role="alert"
      className="sticky top-0 z-50 border-amber-300 border-b bg-amber-50 px-4 py-3 text-amber-900 text-sm shadow-sm dark:border-amber-900/50 dark:bg-amber-950/70 dark:text-amber-100"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2">
          <KeyRound className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">
              Atlas is locked — this browser has no API key, but the server already has one.
            </p>
            <p className="mt-1 text-amber-800/90 text-xs dark:text-amber-200/80">
              Reset stored keys from a terminal, then reload this page.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <code className="rounded border border-amber-300 bg-amber-100 px-2 py-1 font-mono text-xs dark:border-amber-800 dark:bg-amber-900/60">
            {RECOVERY_COMMAND}
          </code>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            aria-label={copied ? 'Command copied' : 'Copy recovery command'}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span className="ml-1.5">{copied ? 'Copied' : 'Copy'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
