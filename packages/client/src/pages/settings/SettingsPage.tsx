import { useSearchParams } from 'react-router-dom';
import { Settings } from 'lucide-react';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { McpConnectionPanel } from '@/components/settings/McpConnectionPanel';
import { AppearanceTab } from './AppearanceTab';
import { DefaultWorkspaceTab } from './DefaultWorkspaceTab';
import { ServerInfoTab } from './ServerInfoTab';
import { DataManagementTab } from './DataManagementTab';
import { AboutTab } from './AboutTab';

const VALID_TABS = [
  'appearance',
  'workspace',
  'mcp',
  'server-info',
  'data',
  'about',
] as const;

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
          <p className="text-muted-foreground mt-1">
            App preferences, connections, and infrastructure
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="workspace">Default Workspace</TabsTrigger>
          <TabsTrigger value="mcp">MCP Connection</TabsTrigger>
          <TabsTrigger value="server-info">Server Info</TabsTrigger>
          <TabsTrigger value="data">Data Management</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="mt-6">
          <AppearanceTab />
        </TabsContent>

        <TabsContent value="workspace" className="mt-6">
          <DefaultWorkspaceTab />
        </TabsContent>

        <TabsContent value="mcp" className="mt-6">
          <McpConnectionPanel />
        </TabsContent>

        <TabsContent value="server-info" className="mt-6">
          <ServerInfoTab />
        </TabsContent>

        <TabsContent value="data" className="mt-6">
          <DataManagementTab />
        </TabsContent>

        <TabsContent value="about" className="mt-6">
          <AboutTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
