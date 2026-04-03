// Components
import { McpConnectionPanel } from '@/components/settings/McpConnectionPanel';
import { McpServersTab } from './McpServersTab';

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
