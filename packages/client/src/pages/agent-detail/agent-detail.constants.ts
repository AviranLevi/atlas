// Types
import type { HeartbeatRun } from '@atlas/shared';

export const SCHEDULE_PRESETS = [
  { label: 'Every 15 minutes', value: '*/15 * * * *' },
  { label: 'Every 30 minutes', value: '*/30 * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Every 4 hours', value: '0 */4 * * *' },
  { label: 'Daily at 9am', value: '0 9 * * *' },
  { label: 'Custom', value: 'custom' },
] as const;

export const ALL_PROJECTS_VALUE = '__all__';

export function cronFromPreset(schedulePreset: string, customCron: string): string {
  if (schedulePreset === 'custom') return customCron.trim();
  return schedulePreset;
}

export function presetFromCron(cronExpression: string): { preset: string; custom: string } {
  const match = SCHEDULE_PRESETS.find((p) => p.value !== 'custom' && p.value === cronExpression);
  if (match) return { preset: match.value, custom: '' };
  return { preset: 'custom', custom: cronExpression };
}

export function formatResult(result: HeartbeatRun['result']): string {
  if (!result) return '—';
  return result.replace(/_/g, ' ');
}

export function statusBadgeClass(status: HeartbeatRun['status']): string {
  switch (status) {
    case 'working':
      return 'border-yellow-500/40 bg-yellow-500/10 text-yellow-800 dark:text-yellow-300';
    case 'completed':
      return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300';
    case 'skipped':
      return 'border-muted-foreground/30 bg-muted text-muted-foreground';
    case 'failed':
      return 'border-destructive/40 bg-destructive/10 text-destructive';
    default:
      return 'border-muted-foreground/30 bg-muted/50 text-muted-foreground';
  }
}
