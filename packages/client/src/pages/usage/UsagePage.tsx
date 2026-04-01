// React / library
import { BarChart3, Loader2, Zap, Info } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

// Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Hooks
import { useAgentProviders } from '@/hooks/use-agent-providers.hook';
import { useUsageSummary } from '@/hooks/use-usage.hook';

type Period = '7d' | '30d' | 'all';
type GroupBy = 'agent' | 'project';

function formatTokens(n: number): string {
  return n.toLocaleString('en-US');
}

export function UsagePage() {
  const [period, setPeriod] = useState<Period>('30d');
  const [groupBy, setGroupBy] = useState<GroupBy>('agent');
  const { data, isLoading, isError, error, refetch } = useUsageSummary(groupBy, period);
  const { data: providers = [], isLoading: providersLoading } = useAgentProviders();

  const hasApiProvider = providers.length > 0;

  return (
    <div>
      <div className="mb-8 flex items-center gap-3">
        <BarChart3 className="h-8 w-8 text-muted-foreground" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usage</h1>
          <p className="text-muted-foreground mt-1">Track token consumption across your AI conversations</p>
        </div>
      </div>

      {!providersLoading && !hasApiProvider && (
        <div className="mb-8 flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/10 px-6 py-16 text-center">
          <BarChart3 className="mb-4 h-12 w-12 text-muted-foreground/40" aria-hidden />
          <h2 className="text-lg font-semibold">No API provider configured</h2>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground">
            Usage tracking measures token consumption from API-mode chat conversations. CLI agents (Claude Code, Gemini
            CLI, etc.) manage their own billing and are not tracked here.
          </p>
          <p className="mt-1 max-w-lg text-sm text-muted-foreground">Add an API provider to start tracking usage.</p>
          <Button asChild className="mt-5">
            <Link to="/agents">Configure Provider</Link>
          </Button>
        </div>
      )}

      {(hasApiProvider || providersLoading) && (
        <>
          <div className="mb-6 flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Tracks tokens from API-mode chat conversations only. CLI agents (Claude Code, Gemini CLI) handle billing
              separately and are not tracked here.
            </p>
          </div>

          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                <SelectTrigger className="w-full sm:w-[200px]" aria-label="Time period">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
              <Tabs value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)} className="w-full sm:w-auto">
                <TabsList className="grid w-full grid-cols-2 sm:inline-flex sm:w-auto">
                  <TabsTrigger value="agent" className="gap-1.5">
                    <Zap className="h-3.5 w-3.5" aria-hidden />
                    By Agent
                  </TabsTrigger>
                  <TabsTrigger value="project">By Project</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </>
      )}

      {(hasApiProvider || providersLoading) && (
        <>
          {isLoading && (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {isError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <p className="text-destructive">{error?.message ?? 'Could not load usage.'}</p>
              <Button type="button" variant="link" className="mt-2 h-auto p-0" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          )}

          {!isLoading && !isError && data && (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Totals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg border border-border bg-muted/20 p-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-normal">
                          Input
                        </Badge>
                      </div>
                      <p className="mt-2 font-mono text-2xl font-semibold tabular-nums">
                        {formatTokens(data.totals.inputTokens)}
                      </p>
                      <p className="text-xs text-muted-foreground">tokens</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 p-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-normal">
                          Output
                        </Badge>
                      </div>
                      <p className="mt-2 font-mono text-2xl font-semibold tabular-nums">
                        {formatTokens(data.totals.outputTokens)}
                      </p>
                      <p className="text-xs text-muted-foreground">tokens</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 p-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-normal">
                          Total
                        </Badge>
                      </div>
                      <p className="mt-2 font-mono text-2xl font-semibold tabular-nums">
                        {formatTokens(data.totals.totalTokens)}
                      </p>
                      <p className="text-xs text-muted-foreground">tokens</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Runs</p>
                      <p className="mt-2 font-mono text-2xl font-semibold tabular-nums">
                        {formatTokens(data.totals.runs)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {data.items.length === 0 ? (
                <div className="mt-6 flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/10 px-6 py-16 text-center">
                  <BarChart3 className="mb-3 h-10 w-10 text-muted-foreground/60" aria-hidden />
                  <p className="max-w-md text-sm text-muted-foreground">
                    No usage data yet. Start a chat conversation using an API provider and token usage will appear here
                    automatically.
                  </p>
                </div>
              ) : (
                <Card className="mt-6">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{groupBy === 'agent' ? 'By agent' : 'By project'}</CardTitle>
                  </CardHeader>
                  <CardContent className="overflow-x-auto p-0 sm:p-6 sm:pt-0">
                    <table className="w-full min-w-[640px] text-sm">
                      <thead>
                        <tr className="border-b border-border text-left">
                          <th className="px-6 py-3 font-medium text-muted-foreground">Name</th>
                          <th className="px-4 py-3 text-right font-medium text-muted-foreground">Input Tokens</th>
                          <th className="px-4 py-3 text-right font-medium text-muted-foreground">Output Tokens</th>
                          <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total Tokens</th>
                          <th className="px-6 py-3 text-right font-medium text-muted-foreground">Runs</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.items.map((row) => (
                          <tr key={row.id} className="border-b border-border/80 last:border-0">
                            <td className="px-6 py-3 font-medium">{row.name}</td>
                            <td className="px-4 py-3 text-right font-mono tabular-nums">
                              {formatTokens(row.inputTokens)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono tabular-nums">
                              {formatTokens(row.outputTokens)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono tabular-nums">
                              {formatTokens(row.totalTokens)}
                            </td>
                            <td className="px-6 py-3 text-right font-mono tabular-nums">{formatTokens(row.runs)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
