import type { ElementType } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';

import { useTheme, type ThemePreference } from '@/hooks/use-theme.hook';
import { cn } from '@/lib/utils';

const THEME_OPTIONS: {
  value: ThemePreference;
  label: string;
  icon: ElementType<{ className?: string }>;
}[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

export function AppearanceTab() {
  const { preference, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Theme</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Choose how the application looks. Select &quot;System&quot; to automatically match your
          operating system&apos;s theme.
        </p>
      </div>

      <div className="flex gap-4">
        {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            className={cn(
              'flex flex-col items-center gap-3 rounded-lg border-2 p-6 transition-colors w-40',
              preference === value
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-muted-foreground/30'
            )}
          >
            <Icon
              className={cn(
                'h-8 w-8',
                preference === value ? 'text-primary' : 'text-muted-foreground'
              )}
            />
            <span
              className={cn(
                'text-sm font-medium',
                preference === value ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
