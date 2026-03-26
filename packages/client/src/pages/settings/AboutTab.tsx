import { ExternalLink } from 'lucide-react';

import { cn } from '@/lib/utils';

const LINK_CLASS =
  'inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline';

export function AboutTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Agents Manager</h2>
        <p className="mt-1 font-mono text-sm text-muted-foreground">v0.0.1</p>
      </div>

      <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
        Plan, run, and review coding agent work across projects from one place.
      </p>

      <div className="flex gap-6">
        <a href="#" className={cn(LINK_CLASS)}>
          GitHub
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
        <a href="#" className={cn(LINK_CLASS)}>
          Documentation
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      </div>

      <p className="border-t border-border pt-6 text-xs text-muted-foreground">
        Licensed under the MIT License.
      </p>
    </div>
  );
}
