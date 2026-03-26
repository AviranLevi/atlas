import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { useProjects } from '@/hooks/use-projects.hook';
import type { Project } from '@my-agents/shared';

const STORAGE_KEY = 'active-project-id';

type ProjectContextValue = {
  /** Currently selected project ID, or null for "All Projects" */
  activeProjectId: string | null;
  /** The full project object, or null if "All" */
  activeProject: Project | null;
  /** All available projects */
  projects: Project[];
  /** Select a project tab (null = All) */
  setActiveProjectId: (id: string | null) => void;
  /** Whether projects are loading */
  isLoading: boolean;
};

const ProjectCtx = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { data: projects = [], isLoading } = useProjects();
  const [activeProjectId, setActiveProjectIdRaw] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY),
  );

  const setActiveProjectId = useCallback((id: string | null) => {
    setActiveProjectIdRaw(id);
    if (id) {
      localStorage.setItem(STORAGE_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Resolve active project — if stored ID no longer exists, fall back to All
  const activeProject = activeProjectId
    ? projects.find((p) => p.id === activeProjectId) ?? null
    : null;

  useEffect(() => {
    if (activeProjectId && !activeProject && projects.length > 0) {
      setActiveProjectIdRaw(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [activeProjectId, activeProject, projects.length]);

  return (
    <ProjectCtx.Provider
      value={{
        activeProjectId: activeProject ? activeProjectId : null,
        activeProject,
        projects,
        setActiveProjectId,
        isLoading,
      }}
    >
      {children}
    </ProjectCtx.Provider>
  );
}

export function useActiveProject() {
  const ctx = useContext(ProjectCtx);
  if (!ctx) throw new Error('useActiveProject must be used within ProjectProvider');
  return ctx;
}
