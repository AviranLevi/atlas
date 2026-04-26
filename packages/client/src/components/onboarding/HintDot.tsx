// FILE_PATH: packages/client/src/components/onboarding/HintDot.tsx

// React / library
import { type ReactNode, useCallback, useState } from 'react';

// Components
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Hooks
import { useTourActive } from '@/hooks/use-tour-active.hook';
import { useTourState, useTourStateMutations } from '@/hooks/use-tour-state.hook';

// Lib
import { isReducedMotion } from '@/lib/tours/tour-engine';
import { HINT_COPY } from '@/lib/tours/hint-copy';

// Types
import type { HintId } from '@/lib/tours/tour-types';

type Anchor = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

type HintDotProps = {
  id: HintId;
  /** Corner of the wrapped element to anchor the dot to. Defaults to top-right. */
  anchor?: Anchor;
  /** Wrapped control. The dot floats over its corner. */
  children: ReactNode;
  /**
   * If `true`, clicking the wrapped element also marks the hint seen
   * (recommended for buttons — opening the thing implies discovery).
   * Defaults to `true`.
   */
  dismissOnChildClick?: boolean;
  /**
   * Override the wrapper className. Default is `relative inline-flex` (sized
   * to children). Pass `relative block` (or similar) to wrap a block-level
   * element like a banner that should fill its container.
   */
  className?: string;
};

const ANCHOR_POSITION: Record<Anchor, string> = {
  'top-right': '-top-1 -right-1',
  'top-left': '-top-1 -left-1',
  'bottom-right': '-bottom-1 -right-1',
  'bottom-left': '-bottom-1 -left-1',
};

/**
 * Plan §8 — pulsing dot anchored to a non-obvious, high-leverage control.
 *
 * Behavior:
 *   - Renders only when `prefs[hint.<id>.seen]` is unset AND no tour is active.
 *   - Hover/focus the dot → popover with the title/body from `HINT_COPY`.
 *   - Click the dot OR (by default) the wrapped element → mark seen, dot vanishes forever.
 *   - Reduced motion → static dot (no keyframe).
 *
 * No-op rendering when seen — children pass through with zero overhead.
 */
export function HintDot({
  id,
  anchor = 'top-right',
  children,
  dismissOnChildClick = true,
  className = 'relative inline-flex',
}: HintDotProps) {
  const { isHintSeen } = useTourState();
  const { markHintSeen } = useTourStateMutations();
  const tourActive = useTourActive();
  const [open, setOpen] = useState(false);
  const seen = isHintSeen(id);

  const dismiss = useCallback(() => {
    if (seen) return;
    void markHintSeen(id);
    setOpen(false);
  }, [seen, markHintSeen, id]);

  // Once seen (or while a tour is running) the wrapper is a no-op pass-through.
  if (seen || tourActive) {
    return <>{children}</>;
  }

  const copy = HINT_COPY[id];
  const reduced = isReducedMotion();

  return (
    <div className={className} onClickCapture={dismissOnChildClick ? dismiss : undefined}>
      {children}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={`Hint: ${copy.title}`}
            onMouseEnter={() => setOpen(true)}
            onFocus={() => setOpen(true)}
            onClick={(e) => {
              e.stopPropagation();
              dismiss();
            }}
            className={`absolute ${ANCHOR_POSITION[anchor]} z-10 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-primary outline-none ring-2 ring-background focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
              reduced ? '' : 'atlas-hint-pulse'
            }`}
          />
        </PopoverTrigger>
        <PopoverContent side="top" align="end" className="w-64 text-xs">
          <p className="text-sm font-semibold">{copy.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{copy.body}</p>
        </PopoverContent>
      </Popover>
    </div>
  );
}
