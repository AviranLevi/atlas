// React / library
import { Save, X } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Types
import type { DispatchRuleFormRowProps } from './settings-page.types';

// Constants
import { NONE_SKILL_VALUE } from './settings-page.constants';

/** Inline form row used for both creating and editing dispatch rules. */
export function DispatchRuleFormRow({
  form,
  agents,
  skills,
  isSaving,
  isValid,
  onChange,
  onSave,
  onCancel,
}: DispatchRuleFormRowProps) {
  return (
    <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 border-b px-4 py-3 last:border-b-0">
      <Input
        value={form.pattern}
        onChange={(e) => onChange({ ...form, pattern: e.target.value })}
        placeholder="Pattern"
      />
      <Select
        value={form.agentId}
        onValueChange={(v) => onChange({ ...form, agentId: v })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select agent" />
        </SelectTrigger>
        <SelectContent>
          {agents.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={form.skillId}
        onValueChange={(v) => onChange({ ...form, skillId: v })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select skill" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE_SKILL_VALUE}>None</SelectItem>
          {skills.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex gap-1">
        <Button
          size="icon"
          variant="ghost"
          onClick={onSave}
          disabled={!isValid || isSaving}
          aria-label="Save"
        >
          <Save className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={onCancel}
          aria-label="Cancel"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
