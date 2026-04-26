// Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

// Local
import type { McpServerFormState } from './mcp-servers.helpers';

type McpServerFormRowProps = {
  form: McpServerFormState;
  isSaving: boolean;
  isValid: boolean;
  onChange: (next: McpServerFormState) => void;
  onSave: () => void;
  onCancel: () => void;
};

export function McpServerFormRow({ form, isSaving, isValid, onChange, onSave, onCancel }: McpServerFormRowProps) {
  return (
    <div className="space-y-4 border-b px-4 py-4 last:border-b-0">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="mcp-name">Name</Label>
          <Input
            id="mcp-name"
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
            placeholder="e.g. my-tool"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mcp-command">Command</Label>
          <Input
            id="mcp-command"
            value={form.command}
            onChange={(e) => onChange({ ...form, command: e.target.value })}
            placeholder="e.g. npx"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="mcp-args">Args (comma-separated)</Label>
        <Input
          id="mcp-args"
          value={form.argsStr}
          onChange={(e) => onChange({ ...form, argsStr: e.target.value })}
          placeholder="-y, @scope/mcp-server"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="mcp-env">Environment (one KEY=value per line)</Label>
        <Textarea
          id="mcp-env"
          value={form.envStr}
          onChange={(e) => onChange({ ...form, envStr: e.target.value })}
          placeholder="API_KEY=..."
          rows={4}
          className="font-mono text-sm"
        />
      </div>
      <div className="flex items-center gap-2">
        <Switch
          id="mcp-enabled"
          checked={form.enabled}
          onCheckedChange={(checked: boolean) => onChange({ ...form, enabled: checked })}
        />
        <Label htmlFor="mcp-enabled" className="text-sm font-normal">
          Enabled
        </Label>
      </div>
      <div className="flex gap-2">
        <Button type="button" onClick={onSave} disabled={isSaving || !isValid}>
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
