// React / library
import { useState } from 'react';
import { BarChart3, Loader2, Zap } from 'lucide-react';

// Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Hooks
import { useUsageSummary } from '@/hooks/use-usage.hook';

type Period = '7d' | '30d' | 'all';
type GroupBy = 'agent' | 'project';

function formatTokens(n: number): string {
  return n.toLocaleString('en-US');
}

export function UsageTab() {
  const [period, setPeriod] = useState<Period>('30d');
  const [groupBy, setGroupBy] = useState<GroupBy>('agent');
  const { data, isLoading, isError, error, refetch } = useUsageSummary(
    groupBy,
    period,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted/40">
            <BarChart3 className="h-5 w-5 text-muted-foreground" aria-hidden />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Usage</h2>
            <p className="text-sm text-muted-foreground">
              Token usage from API-mode chat conversations
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <Select
            value={period}
            onValueChange={(v) => setPeriod(v as Period)}
          >
            <SelectTrigger className="w-full sm:w-[200px]" aria-label="Time period">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Tabs
            value={groupBy}
            onValueChange={(v) => setGroupBy(v as GroupBy)}
            className="w-full sm:w-auto"
          >
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

      {isLoading && (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <p className="text-destructive">
            {error?.message ?? 'Could not load usage.'}
          </p>
          <Button
            type="button"
            variant="link"
            className="mt-2 h-auto p-0"
            onClick={() => refetch()}
          >
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
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Runs
                  </p>
                  <p className="mt-2 font-mono text-2xl font-semibold tabular-nums">
                    {formatTokens(data.totals.runs)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {data.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/10 px-6 py-16 text-center">
              <BarChart3
                className="mb-3 h-10 w-10 text-muted-foreground/60"
                aria-hidden
              />
              <p className="max-w-md text-sm text-muted-foreground">
                No usage data yet. Token usage is tracked automatically during
                API-mode chat conversations.
              </p>
            </div>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {groupBy === 'agent' ? 'By agent' : 'By project'}
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto p-0 sm:p-6 sm:pt-0">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="px-6 py-3 font-medium text-muted-foreground">
                        Name
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                        Input Tokens
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                        Output Tokens
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                        Total Tokens
                      </th>
                      <th className="px-6 py-3 text-right font-medium text-muted-foreground">
                        Runs
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-border/80 last:border-0"
                      >
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
                        <td className="px-6 py-3 text-right font-mono tabular-nums">
                          {formatTokens(row.runs)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
