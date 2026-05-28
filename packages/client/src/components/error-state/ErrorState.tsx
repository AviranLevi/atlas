// React / library
import { AlertTriangle } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';

// Lib
import { cn } from '@/lib/utils';

type ErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
  className?: string;
};

/**
 * Inline error surface for pages/sections where a query failed.
 * Mirrors the visual style of EmptyState (dashed border, centered content).
 */
export function ErrorState({
  title = 'Something went wrong',
  message = 'Failed to load data. Please try again.',
  onRetry,
  compact = false,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn('rounded-lg border border-dashed text-center', compact ? 'p-6' : 'p-12', className)}>
      <AlertTriangle
        aria-hidden
        className={cn('text-destructive mx-auto', compact ? 'mb-3 h-8 w-8' : 'mb-4 h-10 w-10')}
      />
      <h3 className={cn('mb-1 font-medium', compact ? 'text-sm' : 'text-base')}>{title}</h3>
      <p className={cn('text-muted-foreground mx-auto max-w-sm', compact ? 'mb-3 text-xs' : 'mb-4 text-sm')}>
        {message}
      </p>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
