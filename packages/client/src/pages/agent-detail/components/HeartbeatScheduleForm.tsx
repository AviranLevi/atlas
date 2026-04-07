// React / library
import { Play, Trash2 } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

// Types
import type { Project } from '@atlas/shared';

// Constants
import { ALL_PROJECTS_VALUE, SCHEDULE_PRESETS } from '../agent-detail.constants';

type AgentRuntime = {
  id: string;
  name: string;
  installed: boolean;
  authenticated: boolean;
};

export type HeartbeatScheduleFormProps = {
  isNew: boolean;
  schedulePreset: string;
  customCron: string;
  runtime: string;
  projectScope: string;
  maxConcurrent: number;
  maxRunsPerDay: number;
  formEnabled: boolean;
  runtimes: AgentRuntime[];
  runtimesLoading: boolean;
  projects: Project[];
  projectsLoading: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  isTriggering: boolean;
  onSchedulePresetChange: (v: string) => void;
  onCustomCronChange: (v: string) => void;
  onRuntimeChange: (v: string) => void;
  onProjectScopeChange: (v: string) => void;
  onMaxConcurrentChange: (v: number) => void;
  onMaxRunsPerDayChange: (v: number) => void;
  onEnabledToggle: (v: boolean) => void;
  onSave: () => void;
  onDelete?: () => void;
  onTestNow?: () => void;
};

export function HeartbeatScheduleForm({
  isNew,
  schedulePreset,
  customCron,
  runtime,
  projectScope,
  maxConcurrent,
  maxRunsPerDay,
  formEnabled,
  runtimes,
  runtimesLoading,
  projects,
  projectsLoading,
  isSaving,
  isDeleting,
  isTriggering,
  onSchedulePresetChange,
  onCustomCronChange,
  onRuntimeChange,
  onProjectScopeChange,
  onMaxConcurrentChange,
  onMaxRunsPerDayChange,
  onEnabledToggle,
  onSave,
  onDelete,
  onTestNow,
}: HeartbeatScheduleFormProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <Label htmlFor="heartbeat-enabled">Enabled</Label>
          <p className="text-muted-foreground text-xs">
            {isNew ? 'Start enabled after you save.' : 'Turn scheduled runs on or off.'}
          </p>
        </div>
        <Switch
          id="heartbeat-enabled"
          checked={formEnabled}
          disabled={!isNew && isSaving}
          onCheckedChange={onEnabledToggle}
        />
      </div>

      <div className="space-y-2">
        <Label>Schedule</Label>
        <Select value={schedulePreset} onValueChange={onSchedulePresetChange}>
          <SelectTrigger>
            <SelectValue placeholder="Schedule" />
          </SelectTrigger>
          <SelectContent>
            {SCHEDULE_PRESETS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {schedulePreset === 'custom' && (
          <Input
            placeholder="Cron expression"
            value={customCron}
            onChange={(e) => onCustomCronChange(e.target.value)}
            className="font-mono text-sm"
          />
        )}
      </div>

      <div className="space-y-2">
        <Label>Agent runtime</Label>
        {runtimesLoading ? (
          <p className="text-muted-foreground text-sm">Loading runtimes…</p>
        ) : (
          <Select value={runtime} onValueChange={onRuntimeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select runtime" />
            </SelectTrigger>
            <SelectContent>
              {runtimes.map((rt) => (
                <SelectItem key={rt.id} value={rt.id} disabled={!rt.installed || !rt.authenticated}>
                  {rt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="space-y-2">
        <Label>Project scope</Label>
        <Select value={projectScope} onValueChange={onProjectScopeChange} disabled={projectsLoading}>
          <SelectTrigger>
            <SelectValue placeholder="All projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_PROJECTS_VALUE}>All projects</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="max-concurrent">Max concurrent</Label>
          <Input
            id="max-concurrent"
            type="number"
            min={1}
            max={3}
            value={maxConcurrent}
            onChange={(e) => onMaxConcurrentChange(Math.min(3, Math.max(1, parseInt(e.target.value, 10) || 1)))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max-runs">Max runs per day</Label>
          <Input
            id="max-runs"
            type="number"
            min={1}
            max={50}
            value={maxRunsPerDay}
            onChange={(e) => onMaxRunsPerDayChange(Math.min(50, Math.max(1, parseInt(e.target.value, 10) || 1)))}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={onSave} disabled={isSaving || !runtime}>
          {isSaving ? 'Saving…' : 'Save'}
        </Button>
        {!isNew && (
          <>
            <Button type="button" variant="outline" onClick={onTestNow} disabled={isTriggering}>
              <Play className="mr-1.5 h-4 w-4" />
              Test now
            </Button>
            <Button
              type="button"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={onDelete}
              disabled={isDeleting}
              aria-label="Delete heartbeat configuration"
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Delete
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
