// External
import { describe, expect, it } from 'vitest';

// Under test
import { resolveShellMode, type ShellModeInputs } from '../src/hooks/use-shell-mode.hook';

function input(over: Partial<ShellModeInputs> = {}): ShellModeInputs {
  return {
    isAuthenticated: true,
    projectsLoading: false,
    projectCount: 1,
    hasActiveProject: true,
    newShellEnabled: true,
    ...over,
  };
}

describe('resolveShellMode', () => {
  it('returns firstRun + ready when not authenticated', () => {
    expect(resolveShellMode(input({ isAuthenticated: false }))).toEqual({ mode: 'firstRun', isReady: true });
  });

  it('returns firstRun + not-ready when authenticated but projects still loading', () => {
    expect(resolveShellMode(input({ projectsLoading: true }))).toEqual({ mode: 'firstRun', isReady: false });
  });

  it('returns firstRun when authenticated but no projects exist', () => {
    expect(resolveShellMode(input({ projectCount: 0, hasActiveProject: false }))).toEqual({
      mode: 'firstRun',
      isReady: true,
    });
  });

  it('returns noActiveProject when authenticated with projects but none selected', () => {
    expect(resolveShellMode(input({ hasActiveProject: false }))).toEqual({
      mode: 'noActiveProject',
      isReady: true,
    });
  });

  it('returns activeProject when authenticated with an active project resolved', () => {
    expect(resolveShellMode(input())).toEqual({ mode: 'activeProject', isReady: true });
  });

  it('forces activeProject mode when the new shell flag is disabled', () => {
    expect(
      resolveShellMode(input({ isAuthenticated: false, projectCount: 0, hasActiveProject: false, newShellEnabled: false })),
    ).toEqual({ mode: 'activeProject', isReady: true });
  });

  it('does not flip out of firstRun when projectsLoading is true even with stale active id', () => {
    // While loading, even a stored active-project id should not graduate the user to state C.
    expect(resolveShellMode(input({ projectsLoading: true, hasActiveProject: true }))).toEqual({
      mode: 'firstRun',
      isReady: false,
    });
  });
});
