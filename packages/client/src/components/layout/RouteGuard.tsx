// React / library
import { Loader2 } from 'lucide-react';
import { Navigate, useLocation } from 'react-router-dom';

// Hooks
import { useShellMode } from '@/hooks/use-shell-mode.hook';

/**
 * Routes that are reachable without an active project (state B + C). Anything not in this
 * list requires an active project — visiting it from state B redirects to /projects.
 *
 * Note: `/agents`, `/skills`, `/rules` are URL-reachable in state B even though they are
 * hidden from the slim sidebar (no `globalAlwaysOn` flag). This is intentional — they are
 * global resource libraries that aren't tied to a project but don't get prime sidebar real
 * estate either. Bookmarks and direct nav still work.
 */
const PROJECT_AGNOSTIC_PATHS = new Set<string>([
  '/projects',
  '/agents',
  '/skills',
  '/rules',
  '/global',
  '/usage',
  '/marketplace',
  '/settings',
  '/setup',
  '/welcome',
]);

// Routes reachable without an API key (state A). Everything else gets sent to /welcome.
const FIRST_RUN_PATHS = new Set<string>(['/welcome', '/setup']);

function isPrefixOf(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}

function isProjectAgnostic(path: string): boolean {
  if (path === '/') return true;
  for (const p of PROJECT_AGNOSTIC_PATHS) if (isPrefixOf(path, p)) return true;
  return false;
}

function isFirstRunAllowed(path: string): boolean {
  for (const p of FIRST_RUN_PATHS) if (isPrefixOf(path, p)) return true;
  return false;
}

/**
 * Top-level navigation guard. Redirects based on the current `ShellMode`:
 *
 *  - `firstRun` — non-onboarding routes redirect to `/welcome`
 *  - `noActiveProject` — project-scoped routes redirect to `/projects`
 *  - `activeProject` — `/welcome` redirects to `/`, otherwise no-op
 *
 * While shell-mode is unresolved (auth ✓, projects loading) the guard renders nothing so
 * downstream pages don't make API calls with stale state.
 */
export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { mode, isReady } = useShellMode();
  const location = useLocation();

  if (!isReady) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-screen items-center justify-center text-muted-foreground"
      >
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        <span className="sr-only">Loading workspace…</span>
      </div>
    );
  }

  const path = location.pathname;

  if (mode === 'firstRun') {
    if (!isFirstRunAllowed(path)) {
      return <Navigate to="/welcome" replace />;
    }
    return <>{children}</>;
  }

  if (mode === 'noActiveProject') {
    if (path === '/welcome') return <Navigate to="/projects" replace />;
    if (path === '/') return <Navigate to="/projects" replace />;
    if (!isProjectAgnostic(path)) {
      return <Navigate to="/projects" replace />;
    }
    return <>{children}</>;
  }

  // mode === 'activeProject'
  if (path === '/welcome') return <Navigate to="/" replace />;
  return <>{children}</>;
}
