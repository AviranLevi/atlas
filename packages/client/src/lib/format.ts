export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/** Strip common markdown syntax and truncate for card previews. */
export function contentPreview(content: string | null, maxLen = 100): string {
  if (!content) return '';
  return content
    .replace(/[#*_`~[\]>]/g, '')
    .replace(/\n+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

export function calcDuration(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt) return '--';
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const diff = Math.floor((end - new Date(startedAt).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m ${diff % 60}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}
