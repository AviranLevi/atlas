// External
import { describe, expect, it } from 'vitest';

// Under test
import {
  asInt,
  buildCompletionPatch,
  buildDismissalPatch,
  FATIGUE_THRESHOLD,
  hintSeenKey,
  isTrue,
  isWithinSnooze,
  shouldAutoPause,
  SNOOZE_MS,
  TOURS_GLOBAL_DISMISSALS_KEY,
  tourCompletedCountKey,
  tourCompletedKey,
  tourDismissedAtKey,
  tourSkipCountKey,
  tourSkipStepSumKey,
} from '../src/lib/tours/tour-state-helpers';

describe('isTrue', () => {
  it('returns true only for the literal string "true"', () => {
    expect(isTrue('true')).toBe(true);
    expect(isTrue('false')).toBe(false);
    expect(isTrue('TRUE')).toBe(false);
    expect(isTrue('')).toBe(false);
    expect(isTrue(undefined)).toBe(false);
  });
});

describe('asInt', () => {
  it('parses string-encoded counters', () => {
    expect(asInt('0')).toBe(0);
    expect(asInt('5')).toBe(5);
    expect(asInt('99')).toBe(99);
  });

  it('treats missing/garbage as 0', () => {
    expect(asInt(undefined)).toBe(0);
    expect(asInt('')).toBe(0);
    expect(asInt('not-a-number')).toBe(0);
  });
});

describe('isWithinSnooze', () => {
  const now = Date.parse('2026-04-26T10:00:00.000Z');

  it('returns false when no timestamp is set', () => {
    expect(isWithinSnooze(undefined, now)).toBe(false);
    expect(isWithinSnooze('', now)).toBe(false);
  });

  it('returns true within the 7-day window', () => {
    const sixDaysAgo = new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString();
    expect(isWithinSnooze(sixDaysAgo, now)).toBe(true);
  });

  it('returns false past the 7-day window', () => {
    const eightDaysAgo = new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString();
    expect(isWithinSnooze(eightDaysAgo, now)).toBe(false);
  });

  it('returns false at exactly the boundary (>=, not <)', () => {
    const exactlySevenDaysAgo = new Date(now - SNOOZE_MS).toISOString();
    expect(isWithinSnooze(exactlySevenDaysAgo, now)).toBe(false);
  });

  it('returns false for unparseable timestamps (defensive)', () => {
    expect(isWithinSnooze('not-a-date', now)).toBe(false);
    expect(isWithinSnooze('2026-99-99T99:99:99Z', now)).toBe(false);
  });
});

describe('shouldAutoPause', () => {
  it('returns true at and beyond the threshold', () => {
    expect(shouldAutoPause(FATIGUE_THRESHOLD)).toBe(true);
    expect(shouldAutoPause(FATIGUE_THRESHOLD + 1)).toBe(true);
    expect(shouldAutoPause(99)).toBe(true);
  });

  it('returns false below the threshold', () => {
    expect(shouldAutoPause(0)).toBe(false);
    expect(shouldAutoPause(1)).toBe(false);
    expect(shouldAutoPause(FATIGUE_THRESHOLD - 1)).toBe(false);
  });

  it('honours a custom threshold', () => {
    expect(shouldAutoPause(2, 5)).toBe(false);
    expect(shouldAutoPause(5, 5)).toBe(true);
  });
});

describe('buildDismissalPatch', () => {
  const fixedNow = new Date('2026-04-26T10:00:00.000Z');

  it('writes ISO timestamp + bumps both counters', () => {
    const { patch, nextGlobalCount } = buildDismissalPatch('kanban', 0, 0, 0, 0, fixedNow);
    expect(patch).toEqual({
      [tourDismissedAtKey('kanban')]: fixedNow.toISOString(),
      [tourSkipCountKey('kanban')]: '1',
      [tourSkipStepSumKey('kanban')]: '0',
      [TOURS_GLOBAL_DISMISSALS_KEY]: '1',
    });
    expect(nextGlobalCount).toBe(1);
  });

  it('increments from existing values monotonically', () => {
    const r1 = buildDismissalPatch('agents', 2, 5, 0, 0, fixedNow);
    expect(r1.patch[tourSkipCountKey('agents')]).toBe('3');
    expect(r1.patch[TOURS_GLOBAL_DISMISSALS_KEY]).toBe('6');
    expect(r1.nextGlobalCount).toBe(6);
  });

  it('records exitedAtStep into the running skip-step sum', () => {
    const r = buildDismissalPatch('agents', 1, 1, 7, 3, fixedNow);
    expect(r.patch[tourSkipStepSumKey('agents')]).toBe('10');
  });
});

describe('buildCompletionPatch', () => {
  it('flips completed flag and bumps the completion counter', () => {
    const { patch, nextCompletedCount } = buildCompletionPatch('kanban', 0);
    expect(patch).toEqual({
      [tourCompletedKey('kanban')]: 'true',
      [tourCompletedCountKey('kanban')]: '1',
    });
    expect(nextCompletedCount).toBe(1);
  });

  it('counts re-runs', () => {
    const { patch, nextCompletedCount } = buildCompletionPatch('kanban', 4);
    expect(patch[tourCompletedCountKey('kanban')]).toBe('5');
    expect(nextCompletedCount).toBe(5);
  });
});

describe('tour fatigue end-to-end (3 dismissals → auto-pause)', () => {
  // Simulates the contract `use-page-tour.hook.ts` enforces: each skip calls
  // buildDismissalPatch with the previous total, then shouldAutoPause flips
  // tours_paused on the third call. Plan §3 rule 6.
  it('auto-pauses on the 3rd dismissal (default threshold)', () => {
    const fixedNow = new Date('2026-04-26T10:00:00.000Z');
    let globalCount = 0;
    let pauseTriggered = false;

    for (let i = 0; i < 3; i++) {
      const { nextGlobalCount } = buildDismissalPatch('kanban', i, globalCount, 0, 0, fixedNow);
      globalCount = nextGlobalCount;
      if (shouldAutoPause(globalCount)) pauseTriggered = true;
    }

    expect(globalCount).toBe(3);
    expect(pauseTriggered).toBe(true);
  });

  it('does NOT auto-pause after only 2 dismissals', () => {
    const fixedNow = new Date('2026-04-26T10:00:00.000Z');
    let globalCount = 0;
    let pauseTriggered = false;

    for (let i = 0; i < 2; i++) {
      const { nextGlobalCount } = buildDismissalPatch('kanban', i, globalCount, 0, 0, fixedNow);
      globalCount = nextGlobalCount;
      if (shouldAutoPause(globalCount)) pauseTriggered = true;
    }

    expect(globalCount).toBe(2);
    expect(pauseTriggered).toBe(false);
  });
});

describe('preference key builders', () => {
  it('builds tour keys with the documented shape', () => {
    expect(tourCompletedKey('kanban')).toBe('tour.kanban.completed');
    expect(tourDismissedAtKey('kanban')).toBe('tour.kanban.dismissed_at');
    expect(tourSkipCountKey('kanban')).toBe('tour.kanban.skip_count');
  });

  it('builds hint keys with the documented shape', () => {
    expect(hintSeenKey('run-ai-review')).toBe('hint.run-ai-review.seen');
    expect(hintSeenKey('mcp-config')).toBe('hint.mcp-config.seen');
  });
});
