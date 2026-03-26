import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useSystemInfo } from '@/hooks/use-system.hook';

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'] as const;
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  const n = bytes / k ** i;
  const rounded = i === 0 ? Math.round(n) : Math.round(n * 100) / 100;
  return `${rounded} ${sizes[i]}`;
}

function formatUptime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

type InfoRowProps = { label: string; value: string };

function InfoCard({ label, value }: InfoRowProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 break-all text-sm font-mono">{value}</p>
    </div>
  );
}

export function ServerInfoTab() {
  const { data, isLoading, isError, error, refetch } = useSystemInfo();

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
        <p className="text-destructive">{error?.message ?? 'Could not load server info.'}</p>
        <Button type="button" variant="link" className="mt-2 h-auto p-0" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const items: InfoRowProps[] = [
    { label: 'Version', value: data.version },
    { label: 'API URL', value: data.apiUrl },
    { label: 'Node.js Version', value: data.nodeVersion },
    { label: 'Database Path', value: data.dbPath },
    { label: 'Database Size', value: formatBytes(data.dbSizeBytes) },
    { label: 'Server Uptime', value: formatUptime(data.uptimeSeconds) },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ label, value }) => (
        <InfoCard key={label} label={label} value={value} />
      ))}
    </div>
  );
}
