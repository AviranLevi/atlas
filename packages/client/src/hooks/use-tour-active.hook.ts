// FILE_PATH: packages/client/src/hooks/use-tour-active.hook.ts

// React / library
import { useEffect, useState } from 'react';

// Lib
import { isTourActive, subscribe } from '@/lib/tours/tour-lock';

/**
 * Reactive view onto the global tour lock. Used by HintDot (plan §8) so dots
 * vanish the moment a tour starts and reappear when it ends.
 *
 * The lock itself is a module-scoped singleton — this hook just wires up a
 * subscriber per consumer.
 */
export function useTourActive(): boolean {
  const [active, setActive] = useState(isTourActive);
  useEffect(() => subscribe(setActive), []);
  return active;
}
