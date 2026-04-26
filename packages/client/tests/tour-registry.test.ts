// External
import { describe, expect, it } from 'vitest';

// Under test
import { loadTourById, loadTourForRoute, matchPage, TOUR_CATALOG } from '../src/lib/tours/tour-registry';
import type { TourId } from '../src/lib/tours/tour-types';

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

  it('expands `:param` segments into single-segment matchers', () => {
    expect(matchPage('/workspaces/:id', '/workspaces/abc-123')).toBe(true);
    expect(matchPage('/workspaces/:id', '/workspaces/abc/extra')).toBe(false);
    expect(matchPage('/workspaces/:id', '/workspaces')).toBe(false);
    // Sanity: `/workspaces` literal still matches only itself, not children.
    expect(matchPage('/workspaces', '/workspaces')).toBe(true);
    expect(matchPage('/workspaces', '/workspaces/abc')).toBe(false);
  });
});

describe('tour registry', () => {
  it('lists at least the M4 wave (projects-dashboard, kanban, agents)', () => {
    const ids = TOUR_CATALOG.map((t) => t.id);
    expect(ids).toContain('projects-dashboard');
    expect(ids).toContain('kanban');
    expect(ids).toContain('agents');
  });

  it('lists the M5 wave (workspaces, workspace-detail, chat)', () => {
    const ids = TOUR_CATALOG.map((t) => t.id);
    expect(ids).toContain('workspaces');
    expect(ids).toContain('workspace-detail');
    expect(ids).toContain('chat');
  });

  it('lists the M6 wave (memory, documents, skills, rules, global)', () => {
    const ids = TOUR_CATALOG.map((t) => t.id);
    expect(ids).toContain('memory');
    expect(ids).toContain('documents');
    expect(ids).toContain('skills');
    expect(ids).toContain('rules');
    expect(ids).toContain('global');
  });

  it('catalog entries all have a non-empty title and description', () => {
    for (const entry of TOUR_CATALOG) {
      expect(entry.title.length).toBeGreaterThan(0);
      expect(entry.description.length).toBeGreaterThan(0);
    }
  });

  it('returns null when no tour is registered for the route', async () => {
    await expect(loadTourForRoute('/anything-unmapped')).resolves.toBeNull();
  });

  it('loads the projects-dashboard tour for /projects', async () => {
    const def = await loadTourForRoute('/projects');
    expect(def?.id).toBe('projects-dashboard');
    expect(def?.steps.length).toBeGreaterThanOrEqual(1);
    expect(def?.steps.length).toBeLessThanOrEqual(5);
  });

  it('every M4 tour respects the 5-step cap and has a non-empty step list', async () => {
    const ids: TourId[] = ['projects-dashboard', 'kanban', 'agents'];
    for (const id of ids) {
      const def = await loadTourById(id);
      expect(def, `tour ${id} should resolve`).not.toBeNull();
      expect(def?.steps.length).toBeGreaterThan(0);
      expect(def?.steps.length).toBeLessThanOrEqual(5);
    }
  });

  it('every M5 tour respects the 5-step cap and has a non-empty step list', async () => {
    const ids: TourId[] = ['workspaces', 'workspace-detail', 'chat'];
    for (const id of ids) {
      const def = await loadTourById(id);
      expect(def, `tour ${id} should resolve`).not.toBeNull();
      expect(def?.steps.length).toBeGreaterThan(0);
      expect(def?.steps.length).toBeLessThanOrEqual(5);
    }
  });

  it('routes /workspaces/:id to the workspace-detail tour, not the workspaces list tour', async () => {
    const detail = await loadTourForRoute('/workspaces/abc-123');
    expect(detail?.id).toBe('workspace-detail');

    const list = await loadTourForRoute('/workspaces');
    expect(list?.id).toBe('workspaces');
  });

  it('routes /chat to the chat tour', async () => {
    const def = await loadTourForRoute('/chat');
    expect(def?.id).toBe('chat');
  });

  it('every M6 tour respects the 5-step cap and has a non-empty step list', async () => {
    const ids: TourId[] = ['memory', 'documents', 'skills', 'rules', 'global'];
    for (const id of ids) {
      const def = await loadTourById(id);
      expect(def, `tour ${id} should resolve`).not.toBeNull();
      expect(def?.steps.length).toBeGreaterThan(0);
      expect(def?.steps.length).toBeLessThanOrEqual(5);
    }
  });

  it('routes the M6 page paths to their tours', async () => {
    expect((await loadTourForRoute('/memory'))?.id).toBe('memory');
    expect((await loadTourForRoute('/documents'))?.id).toBe('documents');
    expect((await loadTourForRoute('/skills'))?.id).toBe('skills');
    expect((await loadTourForRoute('/rules'))?.id).toBe('rules');
    expect((await loadTourForRoute('/global'))?.id).toBe('global');
  });

  it('every catalog id has a matching loader', async () => {
    for (const entry of TOUR_CATALOG) {
      const def = await loadTourById(entry.id);
      expect(def, `loader missing for ${entry.id}`).not.toBeNull();
    }
  });
});
