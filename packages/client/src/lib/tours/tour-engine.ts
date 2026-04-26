// FILE_PATH: packages/client/src/lib/tours/tour-engine.ts

// Library
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

// Lib
import { acquire, release } from './tour-lock';

// Types
import type { Driver, DriveStep } from 'driver.js';
import type { TourDefinition, TourRunResult, TourStep } from './tour-types';

/**
 * Single thin wrapper around `driver.js`. The rest of the codebase NEVER
 * imports `driver.js` directly — only this file does. That means the
 * runtime can be swapped (or stubbed in tests) without touring code-leak.
 */

let prefersReducedMotion = false;
if (typeof window !== 'undefined' && window.matchMedia) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  prefersReducedMotion = mq.matches;
  // Re-evaluate on system changes — the next tour will pick it up.
  mq.addEventListener?.('change', (e) => {
    prefersReducedMotion = e.matches;
  });
}

/**
 * Returns true if the user has the OS-level "reduce motion" preference set.
 * Per plan §11: animations off, autostart still fires.
 */
export function isReducedMotion(): boolean {
  return prefersReducedMotion;
}

function toDriverStep(step: TourStep, isLast: boolean): DriveStep {
  return {
    element: step.selector,
    popover: {
      title: step.title,
      description: step.body,
      side: step.side ?? 'bottom',
      align: step.align ?? 'center',
      showButtons: isLast ? ['previous', 'close'] : ['next', 'previous', 'close'],
      doneBtnText: 'Got it',
      nextBtnText: 'Next',
      prevBtnText: 'Back',
    },
  };
}

function elementForStep(step: TourStep): Element | null {
  return document.querySelector(step.selector);
}

/**
 * Run a tour to completion or skip. Returns a promise that resolves with the
 * outcome — never rejects. Caller is responsible for honouring the result
 * (writing prefs, incrementing fatigue counter, etc.).
 *
 * Side-effects:
 *   - acquires the global tour lock; releases on destroy.
 *   - filters out steps whose `when()` returns false.
 *   - filters out steps whose target isn't currently in the DOM.
 *   - if the resulting step list is empty → resolves `aborted` immediately.
 */
export function startTour(definition: TourDefinition): Promise<TourRunResult> {
  return new Promise((resolve) => {
    if (!acquire()) {
      resolve({ outcome: 'aborted', exitedAtStep: 0 });
      return;
    }

    const eligibleSteps = definition.steps.filter((s) => {
      if (s.when && !s.when()) return false;
      if (!elementForStep(s)) return false;
      return true;
    });

    if (eligibleSteps.length === 0) {
      release();
      resolve({ outcome: 'aborted', exitedAtStep: 0 });
      return;
    }

    let lastIndex = 0;
    let completed = false;
    let resolved = false;

    const animate = !prefersReducedMotion;
    const driverInstance: Driver = driver({
      animate,
      smoothScroll: animate,
      allowClose: true,
      overlayClickBehavior: 'nextStep',
      showProgress: eligibleSteps.length > 1,
      progressText: '{{current}} of {{total}}',
      stagePadding: 6,
      stageRadius: 6,
      popoverOffset: 12,
      popoverClass: 'atlas-tour',
      steps: eligibleSteps.map((s, i) => toDriverStep(s, i === eligibleSteps.length - 1)),
      onHighlighted: (_el, _step, opts) => {
        const idx = opts.state.activeIndex ?? 0;
        lastIndex = idx;
      },
      onNextClick: (_el, _step, opts) => {
        const idx = opts.state.activeIndex ?? 0;
        if (idx >= eligibleSteps.length - 1) {
          completed = true;
          opts.driver.destroy();
          return;
        }
        opts.driver.moveNext();
      },
      onCloseClick: (_el, _step, opts) => {
        opts.driver.destroy();
      },
      onDestroyed: () => {
        if (resolved) return;
        resolved = true;
        release();
        resolve({
          outcome: completed ? 'completed' : 'skipped',
          exitedAtStep: lastIndex,
        });
      },
    });

    driverInstance.drive(0);
  });
}
