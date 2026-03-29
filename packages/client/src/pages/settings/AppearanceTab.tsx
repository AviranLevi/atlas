import type { ElementType } from 'react';
import { Monitor, Moon, Sun, ALargeSmall } from 'lucide-react';

import { useTheme, type ThemePreference } from '@/hooks/use-theme.hook';
import { useFontSize, type FontSize } from '@/hooks/use-font-size.hook';
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

const FONT_SIZE_OPTIONS: {
  value: FontSize;
  label: string;
  sample: string;
}[] = [
  { value: 'sm', label: 'Small', sample: 'Aa' },
  { value: 'md', label: 'Medium', sample: 'Aa' },
  { value: 'lg', label: 'Large', sample: 'Aa' },
];

export function AppearanceTab() {
  const { preference, setTheme } = useTheme();
  const { fontSize, setFontSize } = useFontSize();

  return (
    <div className="space-y-8">
      <div className="space-y-4">
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

      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <ALargeSmall className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Text Size</h3>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Adjust the base text size across the entire application.
          </p>
        </div>

        <div className="flex gap-4">
          {FONT_SIZE_OPTIONS.map(({ value, label, sample }) => (
            <button
              key={value}
              type="button"
              onClick={() => setFontSize(value)}
              className={cn(
                'flex flex-col items-center gap-3 rounded-lg border-2 p-6 transition-colors w-40',
                fontSize === value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/30'
              )}
            >
              <span
                className={cn(
                  'font-semibold select-none',
                  value === 'sm' ? 'text-lg' : value === 'md' ? 'text-2xl' : 'text-3xl',
                  fontSize === value ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {sample}
              </span>
              <span
                className={cn(
                  'text-sm font-medium',
                  fontSize === value ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
