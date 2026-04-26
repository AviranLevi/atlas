// External
import { describe, expect, it } from 'vitest';

// Under test
import { loadTourForRoute, matchPage, TOUR_CATALOG } from '../src/lib/tours/tour-registry';

describe('matchPage', () => {
  it('matches a literal pathname exactly', () => {
    expect(matchPage('/kanban', '/kanban')).toBe(true);
    expect(matchPage('/kanban', '/kanban/123')).toBe(false);
    expect(matchPage('/kanban', '/Kanban')).toBe(false);
  });

  it('uses a regex when given one', () => {
    const p = /^\/projects\/[\w-]+$/;
    expect(matchPage(p, '/projects/abc-123')).toBe(true);
    expect(matchPage(p, '/projects')).toBe(false);
    expect(matchPage(p, '/projects/abc-123/extra')).toBe(false);
  });
});

describe('tour registry', () => {
  it('starts empty (M2 ships engine + zero tours)', () => {
    expect(TOUR_CATALOG).toHaveLength(0);
  });

  it('returns null when no tour is registered for the route', async () => {
    await expect(loadTourForRoute('/kanban')).resolves.toBeNull();
    await expect(loadTourForRoute('/agents')).resolves.toBeNull();
    await expect(loadTourForRoute('/anything')).resolves.toBeNull();
  });
});
