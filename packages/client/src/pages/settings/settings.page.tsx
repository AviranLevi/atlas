// React / library
import { Settings } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

// Components
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AppearanceTab } from './components/AppearanceTab';
import { DefaultWorkspaceTab } from './components/DefaultWorkspaceTab';
import { IntegrationsTab } from './components/IntegrationsTab';
import { McpTab } from './components/McpTab';
import { SystemTab } from './components/SystemTab';

const VALID_TABS = ['appearance', 'workspace', 'mcp', 'integrations', 'system'] as const;

type SettingsTab = (typeof VALID_TABS)[number];

function isValidTab(value: string | null): value is SettingsTab {
  return VALID_TABS.includes(value as SettingsTab);
}

export function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const activeTab: SettingsTab = isValidTab(rawTab) ? rawTab : 'appearance';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  return (
    <div>
      <div className="mb-8 flex items-center gap-3">
        <Settings className="h-8 w-8 text-muted-foreground" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">App preferences, connections, and infrastructure</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="mcp">MCP</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="mt-6">
          <AppearanceTab />
        </TabsContent>

        <TabsContent value="workspace" className="mt-6">
          <DefaultWorkspaceTab />
        </TabsContent>

        <TabsContent value="mcp" className="mt-6">
          <McpTab />
        </TabsContent>

        <TabsContent value="integrations" className="mt-6">
          <IntegrationsTab />
        </TabsContent>

        <TabsContent value="system" className="mt-6">
          <SystemTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
