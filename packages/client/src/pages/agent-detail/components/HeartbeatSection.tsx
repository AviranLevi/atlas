// React / library
import { Timer } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

// Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HeartbeatHistory } from './HeartbeatHistory';
import { HeartbeatScheduleForm } from './HeartbeatScheduleForm';

// Hooks
import {
  useCreateHeartbeatConfig,
  useDeleteHeartbeatConfig,
  useHeartbeatConfigs,
  useHeartbeatHistory,
  useTriggerHeartbeat,
  useUpdateHeartbeatConfig,
} from '@/hooks/use-heartbeats.hook';
import { useProjects } from '@/hooks/use-projects.hook';
import { useAgentRuntimes } from '@/hooks/use-workspaces.hook';

// Constants
import { ALL_PROJECTS_VALUE, SCHEDULE_PRESETS, cronFromPreset, presetFromCron } from '../agent-detail.constants';

type HeartbeatSectionProps = {
  agentId: string;
};

export function HeartbeatSection({ agentId }: HeartbeatSectionProps) {
  const { data: configs = [], isLoading: configsLoading } = useHeartbeatConfigs(agentId);
  const { data: history = [], isLoading: historyLoading } = useHeartbeatHistory(agentId, 10);
  const { data: runtimes = [], isLoading: runtimesLoading } = useAgentRuntimes();
  const { data: projects = [], isLoading: projectsLoading } = useProjects();

  const createConfig = useCreateHeartbeatConfig();
  const updateConfig = useUpdateHeartbeatConfig();
  const deleteConfig = useDeleteHeartbeatConfig();
  const triggerHeartbeat = useTriggerHeartbeat();

  const config = configs[0];
  const [showSetup, setShowSetup] = useState(false);

  const [schedulePreset, setSchedulePreset] = useState<string>(SCHEDULE_PRESETS[4].value);
  const [customCron, setCustomCron] = useState('');
  const [runtime, setRuntime] = useState('');
  const [projectScope, setProjectScope] = useState<string>(ALL_PROJECTS_VALUE);
  const [maxConcurrent, setMaxConcurrent] = useState(1);
  const [maxRunsPerDay, setMaxRunsPerDay] = useState(5);
  const [formEnabled, setFormEnabled] = useState(true);

  const sortedRuntimes = useMemo(() => {
    return [...runtimes].sort((a, b) => {
      const score = (r: (typeof runtimes)[0]) => (r.installed && r.authenticated ? 2 : r.installed ? 1 : 0);
      return score(b) - score(a);
    });
  }, [runtimes]);

  useEffect(() => {
    if (!config) return;
    const { preset, custom } = presetFromCron(config.cronExpression);
    setSchedulePreset(preset);
    setCustomCron(custom);
    setRuntime(config.runtime);
    setProjectScope(config.projectId ?? ALL_PROJECTS_VALUE);
    setMaxConcurrent(Math.min(Math.max(1, config.maxConcurrent), 3));
    setMaxRunsPerDay(Math.min(Math.max(1, config.maxRunsPerDay), 50));
    setFormEnabled(config.enabled);
  }, [config]);

  useEffect(() => {
    if (config || showSetup || runtimesLoading || sortedRuntimes.length === 0) return;
    const first = sortedRuntimes.find((r) => r.installed && r.authenticated);
    if (first) setRuntime(first.id);
  }, [config, showSetup, runtimesLoading, sortedRuntimes]);

  const handleEnabledToggle = (enabled: boolean) => {
    if (config) {
      const prev = formEnabled;
      setFormEnabled(enabled);
      updateConfig.mutate(
        { id: config.id, data: { enabled } },
        {
          onError: () => {
            setFormEnabled(prev);
          },
        },
      );
    } else {
      setFormEnabled(enabled);
    }
  };

  const handleSave = () => {
    const cronExpression = cronFromPreset(schedulePreset, customCron);
    if (!cronExpression) {
      toast.error('Enter a schedule or cron expression');
      return;
    }
    if (!runtime) {
      toast.error('Select an agent runtime');
      return;
    }
    const projectId = projectScope === ALL_PROJECTS_VALUE ? null : projectScope;
    const base = { runtime, cronExpression, enabled: formEnabled, maxConcurrent, maxRunsPerDay, projectId };

    if (config) {
      updateConfig.mutate({ id: config.id, data: base });
    } else {
      createConfig.mutate({ agentId, ...base });
    }
  };

  const handleDelete = () => {
    if (!config) return;
    deleteConfig.mutate(config.id, {
      onSuccess: () => {
        setShowSetup(false);
      },
    });
  };

  const handleTestNow = () => {
    if (!config) return;
    triggerHeartbeat.mutate(config.id);
  };

  if (configsLoading) {
    return (
      <section>
        <p className="text-muted-foreground text-sm">Loading heartbeat…</p>
      </section>
    );
  }

  const showForm = !!config || showSetup;

  return (
    <section>
      <Card>
        <CardHeader className="flex flex-row items-start gap-3 space-y-0">
          <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
            <Timer className="text-primary h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base">Heartbeat</CardTitle>
            <CardDescription>Periodically wake this agent to pick up work on a schedule.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!showForm && (
            <Button
              type="button"
              onClick={() => {
                setSchedulePreset(SCHEDULE_PRESETS[4].value);
                setCustomCron('');
                setProjectScope(ALL_PROJECTS_VALUE);
                setMaxConcurrent(1);
                setMaxRunsPerDay(5);
                setFormEnabled(true);
                setShowSetup(true);
              }}
            >
              Enable Heartbeat
            </Button>
          )}

          {showForm && (
            <HeartbeatScheduleForm
              isNew={!config}
              schedulePreset={schedulePreset}
              customCron={customCron}
              runtime={runtime}
              projectScope={projectScope}
              maxConcurrent={maxConcurrent}
              maxRunsPerDay={maxRunsPerDay}
              formEnabled={formEnabled}
              runtimes={sortedRuntimes}
              runtimesLoading={runtimesLoading}
              projects={projects}
              projectsLoading={projectsLoading}
              isSaving={createConfig.isPending || updateConfig.isPending}
              isDeleting={deleteConfig.isPending}
              isTriggering={triggerHeartbeat.isPending}
              onSchedulePresetChange={setSchedulePreset}
              onCustomCronChange={setCustomCron}
              onRuntimeChange={setRuntime}
              onProjectScopeChange={setProjectScope}
              onMaxConcurrentChange={setMaxConcurrent}
              onMaxRunsPerDayChange={setMaxRunsPerDay}
              onEnabledToggle={handleEnabledToggle}
              onSave={handleSave}
              onDelete={handleDelete}
              onTestNow={handleTestNow}
            />
          )}

          {showForm && <HeartbeatHistory runs={history} isLoading={historyLoading} />}
        </CardContent>
      </Card>
    </section>
  );
}
