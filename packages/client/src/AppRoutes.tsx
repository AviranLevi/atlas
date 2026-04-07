// React / library
import { Navigate, Route, Routes } from 'react-router-dom';

// Pages
import { AgentDetailPage } from '@/pages/agent-detail/agent-detail.page';
import { AgentsPage } from '@/pages/agents/agents.page';
import { ChatPage } from '@/pages/chat/chat.page';
import { GlobalPage } from '@/pages/global/global.page';
import { KanbanPage } from '@/pages/kanban/kanban.page';
import { MemoryPage } from '@/pages/memory/memory.page';
import { ProjectDetailPage } from '@/pages/project-detail/project-detail.page';
import { ProjectsPage } from '@/pages/projects/projects.page';
import { RuleDetailPage } from '@/pages/rule-detail/rule-detail.page';
import { RulesPage } from '@/pages/rules/rules.page';
import { SettingsPage } from '@/pages/settings/settings.page';
import { SkillDetailPage } from '@/pages/skill-detail/skill-detail.page';
import { SkillsPage } from '@/pages/skills/skills.page';
import { UsagePage } from '@/pages/usage/usage.page';
import { WorkspaceDetailPage } from '@/pages/workspaces/workspace-detail.page';
import { WorkspacesPage } from '@/pages/workspaces/workspaces.page';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/kanban" replace />} />
      <Route path="/agents" element={<AgentsPage />} />
      <Route path="/agents/:id" element={<AgentDetailPage />} />
      <Route path="/skills" element={<SkillsPage />} />
      <Route path="/skills/:id" element={<SkillDetailPage />} />
      <Route path="/rules" element={<RulesPage />} />
      <Route path="/rules/:id" element={<RuleDetailPage />} />
      <Route path="/memory" element={<MemoryPage />} />
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/projects/:id" element={<ProjectDetailPage />} />
      <Route path="/kanban" element={<KanbanPage />} />
      <Route path="/workspaces" element={<WorkspacesPage />} />
      <Route path="/workspaces/:id" element={<WorkspaceDetailPage />} />
      <Route path="/global" element={<GlobalPage />} />
      <Route path="/usage" element={<UsagePage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/chat/:id" element={<ChatPage />} />
    </Routes>
  );
}
