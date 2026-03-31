// Components
import { McpServersTab } from './McpServersTab';
import { McpConnectionPanel } from '@/components/settings/McpConnectionPanel';

export function McpTab() {
  return (
    <div className="space-y-8">
      <McpServersTab />

      <div className="border-t pt-8">
        <McpConnectionPanel />
      </div>
    </div>
  );
}
