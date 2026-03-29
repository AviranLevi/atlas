// React / library
import { Toaster } from 'sonner';

// Hooks
import { useTheme } from '@/hooks/use-theme.hook';

/** Renders the Sonner toast container wired to the app's current theme. */
export function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      theme={resolvedTheme}
      richColors
      position="bottom-right"
      toastOptions={{ duration: 4000 }}
    />
  );
}
