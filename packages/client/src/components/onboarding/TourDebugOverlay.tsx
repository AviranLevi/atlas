// FILE_PATH: packages/client/src/components/onboarding/TourDebugOverlay.tsx

// React / library
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

// Lib
import { TOUR_TARGETS } from '@/lib/tours/tour-targets';

/**
 * Plan §12 M8 — dev-only overlay activated by `?tour-debug=1`.
 *
 * Surfaces every `data-tour="..."` element on the current page with a thin
 * outline + a label showing its target key. Catches:
 *   - Stale selectors (a tour step references a target that no longer exists).
 *   - Missing selectors (a target in `TOUR_TARGETS` that was never wired up).
 *   - Layout collisions (two targets overlapping → labels stack visibly).
 *
 * Cheap by design: re-scans the DOM on a 500ms `setInterval` (only while
 * active) and on route change, no MutationObserver. The overlay is opt-in and
 * gated on the URL param, so the cost is exactly zero in production usage.
 */
export function TourDebugOverlay() {
  const [params] = useSearchParams();
  const enabled = params.get('tour-debug') === '1';
  const [boxes, setBoxes] = useState<Box[]>([]);

  useEffect(() => {
    if (!enabled) {
      setBoxes([]);
      return;
    }
    // 500ms tick is plenty — the overlay is a dev tool, not load-bearing.
    // Route changes are picked up on the next tick without an extra dep.
    const tick = () => setBoxes(scanTargets());
    tick();
    const interval = window.setInterval(tick, 500);
    return () => window.clearInterval(interval);
  }, [enabled]);

  if (!enabled) return null;

  const known = new Set<string>(Object.values(TOUR_TARGETS));
  const knownKeys = boxes.filter((b) => known.has(b.value)).length;
  const unknownKeys = boxes.length - knownKeys;
  const wiredValues = new Set(boxes.map((b) => b.value));
  const missingTargets = Object.entries(TOUR_TARGETS)
    .filter(([, v]) => !wiredValues.has(v))
    .map(([k]) => k);

  return (
    <div className="pointer-events-none fixed inset-0 z-9999">
      {boxes.map((b) => (
        <div
          key={`${b.value}-${b.top}-${b.left}`}
          className="absolute box-border border-2 border-dashed border-pink-500/80"
          style={{ top: b.top, left: b.left, width: b.width, height: b.height }}
        >
          <span className="absolute left-0 top-0 -translate-y-full whitespace-nowrap rounded-sm bg-pink-500 px-1 py-0.5 font-mono text-[10px] font-bold text-white">
            {b.value}
          </span>
        </div>
      ))}
      <div className="pointer-events-auto absolute right-2 top-2 max-w-xs rounded-md border bg-background/95 p-3 shadow-lg">
        <p className="text-xs font-semibold">tour-debug</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {knownKeys} wired · {unknownKeys} unknown
          {missingTargets.length > 0 && ` · ${missingTargets.length} unused on this page`}
        </p>
        {missingTargets.length > 0 && (
          <details className="mt-2 text-[11px]">
            <summary className="cursor-pointer text-muted-foreground">unused targets</summary>
            <ul className="mt-1 list-disc pl-4 font-mono text-[10px] text-muted-foreground">
              {missingTargets.slice(0, 20).map((k) => (
                <li key={k}>{k}</li>
              ))}
              {missingTargets.length > 20 && <li>… +{missingTargets.length - 20} more</li>}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
}

type Box = { value: string; top: number; left: number; width: number; height: number };

function scanTargets(): Box[] {
  if (typeof document === 'undefined') return [];
  const nodes = document.querySelectorAll<HTMLElement>('[data-tour]');
  const out: Box[] = [];
  for (const node of nodes) {
    const value = node.getAttribute('data-tour');
    if (!value) continue;
    const rect = node.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;
    // Parent overlay is `position: fixed`, so viewport-relative coords are
    // exactly what we need — DON'T add scrollY/scrollX.
    out.push({
      value,
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });
  }
  return out;
}
