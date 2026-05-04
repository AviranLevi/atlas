// FILE_PATH: packages/client/src/components/empty-state/EmptyState.tsx

// React / library
import { Link } from 'react-router-dom';

// Components
import { Button } from '@/components/ui/button';

// Lib
import { cn } from '@/lib/utils';

// Types
import type { LucideIcon } from 'lucide-react';

type CtaSize = 'sm' | 'default';

type Cta = {
  label: string;
  onClick?: () => void;
  asLink?: { to: string };
  icon?: LucideIcon;
  size?: CtaSize;
};

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  body?: React.ReactNode;
  primaryCta?: Cta;
  secondaryCta?: Cta;
  /** Use a denser layout (smaller icon, less padding). Defaults to false. */
  compact?: boolean;
  className?: string;
  /**
   * Optional `data-tour` selector — useful when a tour wants to point at the
   * empty state itself before there's any content on the page.
   */
  'data-tour'?: string;
};

/**
 * Always-on empty-state surface for list/board/dashboard pages.
 *
 * The single canonical pattern: dashed border, centered icon + title + body,
 * one primary action and optionally a secondary action ("Show me how" → tour).
 * One primary CTA only; never two competing primaries.
 */
export function EmptyState({
  icon: Icon,
  title,
  body,
  primaryCta,
  secondaryCta,
  compact = false,
  className,
  ...rest
}: EmptyStateProps) {
  return (
    <div
      data-tour={rest['data-tour']}
      className={cn('rounded-lg border border-dashed text-center', compact ? 'p-6' : 'p-12', className)}
    >
      <Icon aria-hidden className={cn('text-muted-foreground mx-auto', compact ? 'mb-3 h-8 w-8' : 'mb-4 h-10 w-10')} />
      <h3 className={cn('mb-1 font-medium', compact ? 'text-sm' : 'text-base')}>{title}</h3>
      {body && (
        <p className={cn('text-muted-foreground mx-auto max-w-sm', compact ? 'mb-3 text-xs' : 'mb-4 text-sm')}>
          {body}
        </p>
      )}
      {(primaryCta || secondaryCta) && (
        <div className={cn('flex flex-wrap items-center justify-center gap-2', !compact && 'mt-1')}>
          {primaryCta && <CtaButton cta={primaryCta} variant="default" />}
          {secondaryCta && <CtaButton cta={secondaryCta} variant="outline" />}
        </div>
      )}
    </div>
  );
}

function CtaButton({ cta, variant }: { cta: Cta; variant: 'default' | 'outline' }) {
  const Icon = cta.icon;
  const size: CtaSize = cta.size ?? 'sm';

  if (cta.asLink) {
    return (
      <Button asChild size={size} variant={variant}>
        <Link to={cta.asLink.to}>
          {Icon && <Icon className="mr-1.5 h-4 w-4" aria-hidden />}
          {cta.label}
        </Link>
      </Button>
    );
  }

  return (
    <Button size={size} variant={variant} onClick={cta.onClick}>
      {Icon && <Icon className="mr-1.5 h-4 w-4" aria-hidden />}
      {cta.label}
    </Button>
  );
}
