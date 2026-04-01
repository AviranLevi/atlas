// React / library
import { ALL_STATUSES } from '@/pages/kanban/kanban-page.constants';

// Components
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Types
import type { TaskEstimate, TaskPriority, TaskStatus } from '@atlas/shared';
import type { TaskCoreFieldsProps } from './kanban.types';

// Constants
import { ESTIMATES, NONE_VALUE, PRIORITIES } from './kanban.constants';

export function TaskCoreFields({
  projectId,
  onProjectChange,
  agentId,
  onAgentChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  estimate,
  onEstimateChange,
  projects,
  agents,
}: TaskCoreFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>
            Project <span className="text-destructive">*</span>
          </Label>
          <Select value={projectId} onValueChange={onProjectChange}>
            <SelectTrigger className={projectId === NONE_VALUE ? 'border-destructive/50' : ''}>
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {projectId === NONE_VALUE && <p className="text-xs text-destructive">Required to run tasks</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Agent</Label>
          <Select value={agentId} onValueChange={onAgentChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select agent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>None</SelectItem>
              {agents.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => onStatusChange(v as TaskStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALL_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Priority</Label>
          <Select value={priority} onValueChange={(v) => onPriorityChange(v as TaskPriority)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Estimate</Label>
          <Select value={estimate} onValueChange={(v) => onEstimateChange(v as TaskEstimate)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ESTIMATES.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </>
  );
}
