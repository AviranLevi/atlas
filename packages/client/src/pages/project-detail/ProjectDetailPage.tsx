// React / library
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  Pencil,
  Users,
  ListChecks,
  Brain,
  Milestone,
  Plus,
  GitBranch,
  ScanSearch,
  FolderTree,
  Package,
  Terminal,
  FileCode,
  Settings2,
  RefreshCw,
  FileText,
  UserPlus,
  X,
} from 'lucide-react';
// Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ProjectDialog } from '@/components/projects/ProjectDialog';
import { PhaseCard } from '@/components/phases/PhaseCard';
import { PhaseDialog } from '@/components/phases/PhaseDialog';
// Hooks
import { useProjectContext, useScanProject, useGenerateBrief } from '@/hooks/use-projects.hook';
import { usePhases, useDeletePhase } from '@/hooks/use-phases.hook';
import { useProjectAgents, useAssignAgent, useUnassignAgent } from '@/hooks/use-project-agents.hook';
import { useAgents } from '@/hooks/use-agents.hook';
// Types
import type { ProjectStatus, Task, Phase, ProjectScanData } from '@my-agents/shared';
// Constants & utilities
import { statusConfig, taskStatusConfig, priorityBadgeClass } from './project-detail-page.constants';
import { timeAgo } from '@/lib/format';

function ScanDataSection({ scanData }: { scanData: ProjectScanData }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Project Type & Languages */}
      <Card className="p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <FileCode className="h-4 w-4 text-muted-foreground" />
          Type & Languages
        </div>
        {scanData.projectType && (
          <Badge variant="secondary" className="capitalize">{scanData.projectType}</Badge>
        )}
        {scanData.languages && scanData.languages.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {scanData.languages.map((lang) => (
              <Badge key={lang} variant="outline" className="text-xs">{lang}</Badge>
            ))}
          </div>
        )}
      </Card>

      {/* Key Directories */}
      {scanData.keyDirectories && Object.keys(scanData.keyDirectories).length > 0 && (
        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <FolderTree className="h-4 w-4 text-muted-foreground" />
            Key Directories
          </div>
          <div className="space-y-1">
            {Object.entries(scanData.keyDirectories).map(([label, dir]) => (
              <div key={label} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground capitalize">{label}</span>
                <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-[11px]">{dir}</code>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Dependencies */}
      {scanData.dependencies && scanData.dependencies.length > 0 && (
        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Package className="h-4 w-4 text-muted-foreground" />
            Dependencies ({scanData.dependencies.length})
          </div>
          <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
            {scanData.dependencies.slice(0, 30).map((dep) => (
              <Badge key={dep} variant="outline" className="text-[10px] font-mono">{dep}</Badge>
            ))}
            {scanData.dependencies.length > 30 && (
              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                +{scanData.dependencies.length - 30} more
              </Badge>
            )}
          </div>
        </Card>
      )}

      {/* Scripts */}
      {scanData.scripts && Object.keys(scanData.scripts).length > 0 && (
        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Terminal className="h-4 w-4 text-muted-foreground" />
            Scripts
          </div>
          <div className="space-y-1">
            {Object.entries(scanData.scripts).map(([name, cmd]) => (
              <div key={name} className="flex items-start gap-2 text-xs">
                <code className="bg-primary/10 text-primary rounded px-1.5 py-0.5 font-mono text-[11px] shrink-0">{name}</code>
                <code className="text-muted-foreground font-mono text-[11px] truncate">{cmd}</code>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Formatting & Tooling */}
      {scanData.formatting && (
        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Settings2 className="h-4 w-4 text-muted-foreground" />
            Formatting & Tooling
          </div>
          <div className="flex flex-wrap gap-1">
            {scanData.formatting.prettier && <Badge variant="secondary" className="text-xs">Prettier</Badge>}
            {scanData.formatting.eslint && <Badge variant="secondary" className="text-xs">ESLint</Badge>}
            {scanData.formatting.biome && <Badge variant="secondary" className="text-xs">Biome</Badge>}
            {scanData.formatting.editorconfig && <Badge variant="secondary" className="text-xs">EditorConfig</Badge>}
          </div>
          {scanData.packageManager && (
            <div className="text-xs text-muted-foreground">
              Package Manager: <span className="font-medium text-foreground">{scanData.packageManager}</span>
            </div>
          )}
          {scanData.cicd && (
            <div className="text-xs text-muted-foreground">
              CI/CD: <span className="font-medium text-foreground">{scanData.cicd}</span>
            </div>
          )}
          {scanData.monorepo && <Badge variant="outline" className="text-xs">Monorepo</Badge>}
        </Card>
      )}

      {/* Env Vars & Ports */}
      {((scanData.envVars && scanData.envVars.length > 0) || (scanData.ports && scanData.ports.length > 0)) && (
        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Settings2 className="h-4 w-4 text-muted-foreground" />
            Environment
          </div>
          {scanData.ports && scanData.ports.length > 0 && (
            <div className="text-xs">
              <span className="text-muted-foreground">Ports:</span>{' '}
              {scanData.ports.map((p) => (
                <Badge key={p} variant="outline" className="text-[10px] font-mono ml-1">{p}</Badge>
              ))}
            </div>
          )}
          {scanData.envVars && scanData.envVars.length > 0 && (
            <div>
              <span className="text-muted-foreground text-xs">Required env vars:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {scanData.envVars.map((v) => (
                  <code key={v} className="bg-muted rounded px-1.5 py-0.5 font-mono text-[10px]">{v}</code>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: ctx, isLoading } = useProjectContext(id);
  const { data: phases = [] } = usePhases(id ?? '');
  const deletePhase = useDeletePhase();
  const scanProject = useScanProject();
  const generateBrief = useGenerateBrief();
  const [editOpen, setEditOpen] = useState(false);
  const [phaseDialogOpen, setPhaseDialogOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<Phase | undefined>();
  const [assignPopoverOpen, setAssignPopoverOpen] = useState(false);

  // All hooks must be called before any early returns (Rules of Hooks)
  const { data: projectAgents = [] } = useProjectAgents(id ?? '');
  const { data: allAgents = [] } = useAgents();
  const assignAgent = useAssignAgent();
  const unassignAgent = useUnassignAgent();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading project...</p>
      </div>
    );
  }

  if (!ctx) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <p className="text-muted-foreground text-sm">Project not found</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/projects')}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Projects
        </Button>
      </div>
    );
  }

  const { project, agents: _ctxAgents, tasks, memories } = ctx;
  const status = statusConfig[project.status as ProjectStatus] ?? statusConfig.active;

  const assignedAgentIds = new Set(projectAgents.map((a) => a.id));
  const unassignedAgents = allAgents.filter((a) => !assignedAgentIds.has(a.id));

  const tasksByStatus = tasks.reduce(
    (acc, t) => {
      acc[t.status] = (acc[t.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const statCards = [
    { label: 'To Do', count: tasksByStatus['To Do'] ?? 0, color: 'text-muted-foreground' },
    { label: 'In Progress', count: tasksByStatus['In Progress'] ?? 0, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'In Review', count: tasksByStatus['In Review'] ?? 0, color: 'text-yellow-600 dark:text-yellow-400' },
    { label: 'Done', count: tasksByStatus['Done'] ?? 0, color: 'text-green-600 dark:text-green-400' },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit"
          onClick={() => navigate('/projects')}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Projects
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {project.color && (
              <div
                className="mt-1.5 h-4 w-4 shrink-0 rounded-full"
                style={{ backgroundColor: project.color }}
              />
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
                <Badge variant="outline" className={status.className}>
                  {status.label}
                </Badge>
                {project.scanData?.projectType && (
                  <Badge variant="secondary" className="capitalize text-xs">
                    {project.scanData.projectType}
                  </Badge>
                )}
              </div>
              {project.description && (
                <p className="text-muted-foreground mt-1 text-sm">{project.description}</p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {project.techStack
                  ?.split(',')
                  .map((t) => t.trim())
                  .filter(Boolean)
                  .map((tech) => (
                    <Badge key={tech} variant="secondary" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                {project.defaultBranch && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <GitBranch className="h-3 w-3" />
                    {project.defaultBranch}
                  </Badge>
                )}
                {project.repositoryUrl && (
                  <a
                    href={project.repositoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Repository
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {project.localPath && (
              <Button variant="outline" size="sm" asChild>
                <button
                  type="button"
                  onClick={() => scanProject.mutate(project.id)}
                  disabled={scanProject.isPending}
                >
                  <ScanSearch className={`mr-1.5 h-4 w-4 ${scanProject.isPending ? 'animate-pulse' : ''}`} />
                  {scanProject.isPending ? 'Scanning...' : project.scanData ? 'Re-scan' : 'Scan Project'}
                </button>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-1.5 h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>
      </div>

      {/* Scan Data */}
      {project.scanData ? (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ScanSearch className="text-muted-foreground h-4 w-4" />
              <h2 className="text-sm font-semibold">Project Intelligence</h2>
            </div>
            {project.scanData.scannedAt && (
              <span className="text-muted-foreground text-xs">
                Scanned {timeAgo(project.scanData.scannedAt)}
              </span>
            )}
          </div>
          <ScanDataSection scanData={project.scanData} />
        </section>
      ) : project.localPath ? (
        <Card className="flex flex-col items-center gap-3 p-8 border-dashed">
          <ScanSearch className="h-8 w-8 text-muted-foreground" />
          <div className="text-center">
            <p className="font-medium text-sm">No project scan data yet</p>
            <p className="text-muted-foreground text-xs mt-1">
              Scan your project to detect tech stack, dependencies, directory structure, and more.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <button
              type="button"
              onClick={() => scanProject.mutate(project.id)}
              disabled={scanProject.isPending}
            >
              <ScanSearch className={`mr-1.5 h-4 w-4 ${scanProject.isPending ? 'animate-pulse' : ''}`} />
              {scanProject.isPending ? 'Scanning...' : 'Scan Project'}
            </button>
          </Button>
        </Card>
      ) : null}

      {/* Project Brief */}
      {project.projectBrief ? (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="text-muted-foreground h-4 w-4" />
              <h2 className="text-sm font-semibold">Project Brief</h2>
              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                auto-generated for agents
              </Badge>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <button
                type="button"
                onClick={() => generateBrief.mutate(project.id)}
                disabled={generateBrief.isPending}
              >
                <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${generateBrief.isPending ? 'animate-spin' : ''}`} />
                {generateBrief.isPending ? 'Regenerating...' : 'Regenerate'}
              </button>
            </Button>
          </div>
          <Card className="p-4">
            <pre className="whitespace-pre-wrap text-xs font-mono text-muted-foreground leading-relaxed max-h-64 overflow-y-auto">
              {project.projectBrief}
            </pre>
          </Card>
        </section>
      ) : project.scanData ? (
        <Card className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Generate Project Brief</p>
              <p className="text-muted-foreground text-xs">
                Compress scan data and memories into a compact brief for agents.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <button
              type="button"
              onClick={() => generateBrief.mutate(project.id)}
              disabled={generateBrief.isPending}
            >
              <FileText className={`mr-1.5 h-4 w-4 ${generateBrief.isPending ? 'animate-pulse' : ''}`} />
              {generateBrief.isPending ? 'Generating...' : 'Generate Brief'}
            </button>
          </Button>
        </Card>
      ) : null}

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label} className="flex flex-col items-center gap-1 p-4">
            <span className={`text-2xl font-bold ${s.color}`}>{s.count}</span>
            <span className="text-muted-foreground text-xs">{s.label}</span>
          </Card>
        ))}
      </div>

      {/* Assigned Agents */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="text-muted-foreground h-4 w-4" />
            <h2 className="text-sm font-semibold">Assigned Agents ({projectAgents.length})</h2>
          </div>
          <Popover open={assignPopoverOpen} onOpenChange={setAssignPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <UserPlus className="mr-1.5 h-4 w-4" />
                Assign Agent
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-2">
              <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Available Agents</p>
              {unassignedAgents.length === 0 ? (
                <p className="px-2 py-3 text-center text-xs text-muted-foreground">All agents are assigned.</p>
              ) : (
                <div className="flex flex-col gap-0.5">
                  {unassignedAgents.map((agent) => (
                    <button
                      key={agent.id}
                      type="button"
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors"
                      onClick={() => {
                        assignAgent.mutate({ projectId: project.id, agentId: agent.id });
                        setAssignPopoverOpen(false);
                      }}
                    >
                      <div className="bg-primary/10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-medium">
                        {agent.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="truncate">{agent.name}</span>
                      <Plus className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
        {projectAgents.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            No agents assigned to this project yet. Assign agents to scope their work.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {projectAgents.map((agent) => (
              <Card key={agent.id} className="group relative flex items-center gap-2 px-3 py-2">
                <div className="bg-primary/10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                  {agent.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{agent.name}</p>
                  {agent.role && (
                    <Badge variant="secondary" className="text-[10px]">{agent.role}</Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => unassignAgent.mutate({ projectId: project.id, agentId: agent.id })}
                  aria-label={`Remove ${agent.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Phases */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Milestone className="text-muted-foreground h-4 w-4" />
            <h2 className="text-sm font-semibold">Phases ({phases.length})</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setEditingPhase(undefined); setPhaseDialogOpen(true); }}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add Phase
          </Button>
        </div>
        {phases.length === 0 ? (
          <p className="text-muted-foreground text-xs">No phases defined yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {phases.map((phase) => (
              <PhaseCard
                key={phase.id}
                phase={phase}
                onEdit={(p) => { setEditingPhase(p); setPhaseDialogOpen(true); }}
                onDelete={(phaseId) => {
                  if (confirm('Delete this phase? Tasks in this phase will be unassigned.')) {
                    deletePhase.mutate(phaseId);
                  }
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Tasks */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListChecks className="text-muted-foreground h-4 w-4" />
            <h2 className="text-sm font-semibold">Tasks ({tasks.length})</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/kanban?projectId=${project.id}`)}
          >
            Open in Kanban
          </Button>
        </div>
        {tasks.length === 0 ? (
          <p className="text-muted-foreground text-xs">No tasks for this project yet.</p>
        ) : (
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="hidden px-3 py-2 font-medium sm:table-cell">Priority</th>
                  <th className="hidden px-3 py-2 font-medium md:table-cell">Estimate</th>
                  <th className="hidden px-3 py-2 font-medium lg:table-cell">Tags</th>
                  <th className="px-3 py-2 text-right font-medium">Age</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task: Task) => {
                  const ts = taskStatusConfig[task.status];
                  return (
                    <tr key={task.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="max-w-[240px] truncate px-3 py-2 font-medium">{task.name}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center gap-1 text-xs ${ts?.className ?? ''}`}>
                          {ts?.icon}
                          {task.status}
                        </span>
                      </td>
                      <td className="hidden px-3 py-2 sm:table-cell">
                        <Badge variant="outline" className={`text-xs ${priorityBadgeClass[task.priority] ?? ''}`}>
                          {task.priority}
                        </Badge>
                      </td>
                      <td className="hidden px-3 py-2 md:table-cell">
                        <Badge variant="outline" className="text-xs">{task.estimate}</Badge>
                      </td>
                      <td className="hidden px-3 py-2 lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {task.tags?.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="text-muted-foreground px-3 py-2 text-right text-xs">
                        {timeAgo(task.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Memories */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Brain className="text-muted-foreground h-4 w-4" />
          <h2 className="text-sm font-semibold">Memories ({memories.length})</h2>
        </div>
        {memories.length === 0 ? (
          <p className="text-muted-foreground text-xs">No memories recorded for this project yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {memories.map((mem) => (
              <Card key={mem.id as string} className="p-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">{String(mem.scope ?? 'project')}</Badge>
                  <span className="text-muted-foreground text-xs">{timeAgo(String(mem.createdAt))}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm">{String(mem.content ?? '')}</p>
              </Card>
            ))}
          </div>
        )}
      </section>

      <ProjectDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        project={project}
      />
      <PhaseDialog
        open={phaseDialogOpen}
        onOpenChange={setPhaseDialogOpen}
        projectId={project.id}
        phase={editingPhase}
      />
    </div>
  );
}
