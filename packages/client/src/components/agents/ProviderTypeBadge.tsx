import { Badge } from '@/components/ui/badge';
import type { ProviderType } from '@my-agents/shared';
import type { ProviderBadgeProps } from './agents.types';
import { PROVIDER_LABELS } from './agents.constants';

const PROVIDER_COLORS: Record<ProviderType, string> = {
  anthropic: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  openai: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  google: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  'openai-compatible': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ollama: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

export function ProviderTypeBadge({ type }: ProviderBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={`text-xs font-medium ${PROVIDER_COLORS[type] ?? ''}`}
    >
      {PROVIDER_LABELS[type] ?? type}
    </Badge>
  );
}
