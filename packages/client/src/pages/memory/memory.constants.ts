export function formatLastUsed(date: string | null): string {
  if (!date) return 'Never';
  const diff = Date.now() - new Date(date).getTime();
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const months = Math.floor(diff / 2592000000);
  const years = Math.floor(diff / 31536000000);
  if (years > 0) return rtf.format(-years, 'year');
  if (months > 0) return rtf.format(-months, 'month');
  if (days > 0) return rtf.format(-days, 'day');
  if (hours > 0) return rtf.format(-hours, 'hour');
  if (minutes > 0) return rtf.format(-minutes, 'minute');
  return rtf.format(-seconds, 'second');
}

export const TYPE_BADGE_VARIANTS: Record<string, string> = {
  Decision: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  Convention: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  Preference: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  Problem: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'Decision', label: 'Decision' },
  { value: 'Convention', label: 'Convention' },
  { value: 'Preference', label: 'Preference' },
  { value: 'Problem', label: 'Problem' },
];

export const SCOPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'global', label: 'Global' },
  { value: 'project', label: 'Project' },
];

export const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'superseded', label: 'Superseded' },
  { value: 'archived', label: 'Archived' },
  { value: 'all', label: 'All' },
];
