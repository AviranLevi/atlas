// React / library
import { Routes, Route, Navigate } from 'react-router-dom';

// Pages
import { AgentsPage } from '@/pages/agents/AgentsPage';
import { AgentDetailPage } from '@/pages/agent-detail/AgentDetailPage';
import { SkillsPage } from '@/pages/skills/SkillsPage';
import { RulesPage } from '@/pages/rules/RulesPage';
import { MemoryPage } from '@/pages/memory/MemoryPage';
import { ProjectsPage } from '@/pages/projects/ProjectsPage';
import { ProjectDetailPage } from '@/pages/project-detail/ProjectDetailPage';
import { KanbanPage } from '@/pages/kanban/KanbanPage';
import { WorkspacesPage } from '@/pages/workspaces/WorkspacesPage';
import { WorkspaceDetailPage } from '@/pages/workspaces/WorkspaceDetailPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/kanban" replace />} />
      <Route path="/agents" element={<AgentsPage />} />
      <Route path="/agents/:id" element={<AgentDetailPage />} />
      <Route path="/skills" element={<SkillsPage />} />
      <Route path="/rules" element={<RulesPage />} />
      <Route path="/memory" element={<MemoryPage />} />
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/projects/:id" element={<ProjectDetailPage />} />
      <Route path="/kanban" element={<KanbanPage />} />
      <Route path="/workspaces" element={<WorkspacesPage />} />
      <Route path="/workspaces/:id" element={<WorkspaceDetailPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  );
}
