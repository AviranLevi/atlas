import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

const AgentDetailPage = lazy(() =>
  import('@/pages/agent-detail/agent-detail.page').then((m) => ({ default: m.AgentDetailPage })),
);
const AgentsPage = lazy(() => import('@/pages/agents/agents.page').then((m) => ({ default: m.AgentsPage })));
const ChatPage = lazy(() => import('@/pages/chat/chat.page').then((m) => ({ default: m.ChatPage })));
const DocumentsPage = lazy(() =>
  import('@/pages/documents/documents.page').then((m) => ({ default: m.DocumentsPage })),
);
const GlobalPage = lazy(() => import('@/pages/global/global.page').then((m) => ({ default: m.GlobalPage })));
const KanbanPage = lazy(() => import('@/pages/kanban/kanban.page').then((m) => ({ default: m.KanbanPage })));
const MarketplacePage = lazy(() =>
  import('@/pages/marketplace/marketplace.page').then((m) => ({ default: m.MarketplacePage })),
);
const MemoryPage = lazy(() => import('@/pages/memory/memory.page').then((m) => ({ default: m.MemoryPage })));
const NotFoundPage = lazy(() => import('@/pages/not-found/not-found.page').then((m) => ({ default: m.NotFoundPage })));
const ProjectDetailPage = lazy(() =>
  import('@/pages/project-detail/project-detail.page').then((m) => ({
    default: m.ProjectDetailPage,
  })),
);
const ProjectsPage = lazy(() => import('@/pages/projects/projects.page').then((m) => ({ default: m.ProjectsPage })));
const RuleDetailPage = lazy(() =>
  import('@/pages/rule-detail/rule-detail.page').then((m) => ({ default: m.RuleDetailPage })),
);
const RulesPage = lazy(() => import('@/pages/rules/rules.page').then((m) => ({ default: m.RulesPage })));
const SettingsPage = lazy(() => import('@/pages/settings/settings.page').then((m) => ({ default: m.SettingsPage })));
const WelcomePage = lazy(() => import('@/pages/onboarding/welcome.page').then((m) => ({ default: m.WelcomePage })));
const SkillDetailPage = lazy(() =>
  import('@/pages/skill-detail/skill-detail.page').then((m) => ({ default: m.SkillDetailPage })),
);
const SkillsPage = lazy(() => import('@/pages/skills/skills.page').then((m) => ({ default: m.SkillsPage })));
const UsagePage = lazy(() => import('@/pages/usage/usage.page').then((m) => ({ default: m.UsagePage })));
const WorkspaceDetailPage = lazy(() =>
  import('@/pages/workspaces/workspace-detail.page').then((m) => ({
    default: m.WorkspaceDetailPage,
  })),
);
const WorkspacesPage = lazy(() =>
  import('@/pages/workspaces/workspaces.page').then((m) => ({ default: m.WorkspacesPage })),
);

function RouteFallback() {
  return <div className="flex h-full w-full items-center justify-center" aria-busy="true" />;
}

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Navigate to="/projects" replace />} />
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/setup" element={<Navigate to="/welcome" replace />} />
        <Route path="/agents" element={<AgentsPage />} />
        <Route path="/agents/:id" element={<AgentDetailPage />} />
        <Route path="/skills" element={<SkillsPage />} />
        <Route path="/skills/:id" element={<SkillDetailPage />} />
        <Route path="/rules" element={<RulesPage />} />
        <Route path="/rules/:id" element={<RuleDetailPage />} />
        <Route path="/memory" element={<MemoryPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/kanban" element={<KanbanPage />} />
        <Route path="/workspaces" element={<WorkspacesPage />} />
        <Route path="/workspaces/:id" element={<WorkspaceDetailPage />} />
        <Route path="/global" element={<GlobalPage />} />
        <Route path="/usage" element={<UsagePage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/chat/:id" element={<ChatPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
