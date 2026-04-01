// React / library
import { Bot, Github, Zap } from 'lucide-react';

// Lib
import { cn } from '@/lib/utils';

// Types
import type { TaskSource } from '@atlas/shared';
import type React from 'react';

const SOURCE_CONFIG: Record<
  Exclude<TaskSource, 'human'>,
  { icon: React.ElementType; label: string; className: string }
> = {
  agent: { icon: Bot, label: 'Created by agent', className: 'text-blue-500' },
  dispatch: { icon: Zap, label: 'Auto-dispatched', className: 'text-yellow-500' },
  github: { icon: Github, label: 'From GitHub', className: 'text-purple-500' },
};

export function TaskSourceBadge({ source }: { source: TaskSource | null }) {
  if (!source || source === 'human') return null;
  const config = SOURCE_CONFIG[source];
  if (!config) return null;
  const Icon = config.icon;
  return (
    <span title={config.label} className={cn('inline-flex items-center', config.className)}>
      <Icon className="h-3 w-3" />
    </span>
  );
}
