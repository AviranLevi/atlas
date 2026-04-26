// External
import { afterEach, describe, expect, it } from 'vitest';

// Under test
import { __resetTourLockForTests, acquire, isTourActive, release } from '../src/lib/tours/tour-lock';

describe('tour-lock', () => {
  afterEach(() => {
    __resetTourLockForTests();
  });

  it('starts inactive', () => {
    expect(isTourActive()).toBe(false);
  });

  it('acquire returns true the first time and flips active state', () => {
    expect(acquire()).toBe(true);
    expect(isTourActive()).toBe(true);
  });

  it('acquire returns false while another tour holds the lock', () => {
    expect(acquire()).toBe(true);
    expect(acquire()).toBe(false);
    expect(acquire()).toBe(false);
  });

  it('release frees the lock so a new tour can acquire it', () => {
    acquire();
    release();
    expect(isTourActive()).toBe(false);
    expect(acquire()).toBe(true);
  });

  it('release is idempotent — calling twice without re-acquire is a no-op', () => {
    acquire();
    release();
    release();
    expect(isTourActive()).toBe(false);
    expect(acquire()).toBe(true);
  });
});
