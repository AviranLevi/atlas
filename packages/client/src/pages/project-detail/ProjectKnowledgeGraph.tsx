// React / library
import ForceGraph from 'force-graph';
import type { NodeObject } from 'force-graph';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Hooks
import { useMemories } from '@/hooks/use-memory.hook';
import { useProjectAgents } from '@/hooks/use-project-agents.hook';
import { useRules } from '@/hooks/use-rules.hook';
import { useTasks } from '@/hooks/use-tasks.hook';

// Types
import type { Project } from '@atlas/shared';

// ─── Types ───────────────────────────────────────────────────────────────────

type NodeType = 'project' | 'agent' | 'task' | 'memory' | 'rule';

interface GraphNode {
  id: string;
  name: string;
  type: NodeType;
  val: number;
  entityId: string;
  x?: number;
  y?: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const NODE_CONFIG: Record<NodeType, { color: string; radius: number }> = {
  project: { color: '#6366f1', radius: 10 },
  agent: { color: '#3b82f6', radius: 7 },
  task: { color: '#f59e0b', radius: 5 },
  memory: { color: '#10b981', radius: 5 },
  rule: { color: '#ef4444', radius: 5 },
};

const LEGEND: { type: NodeType; label: string }[] = [
  { type: 'project', label: 'Project' },
  { type: 'agent', label: 'Agents' },
  { type: 'task', label: 'Tasks' },
  { type: 'memory', label: 'Memories' },
  { type: 'rule', label: 'Rules' },
];

// ─── Props ───────────────────────────────────────────────────────────────────

interface ProjectKnowledgeGraphProps {
  project: Project;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ProjectKnowledgeGraph({ project }: ProjectKnowledgeGraphProps) {
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  const projectIdRef = useRef(project.id);
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);
  useEffect(() => {
    projectIdRef.current = project.id;
  }, [project.id]);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<ForceGraph | null>(null);
  const graphDataRef = useRef<{ nodes: GraphNode[]; links: { source: string; target: string }[] }>({
    nodes: [],
    links: [],
  });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // ─── Data ──────────────────────────────────────────────────────────────────

  const { data: tasks = [] } = useTasks({ projectId: project.id });
  const { data: memories = [] } = useMemories({ projectId: project.id });
  const { data: allRules = [] } = useRules();
  const { data: agents = [] } = useProjectAgents(project.id);

  const projectRules = useMemo(() => allRules.filter((r) => r.projectId === project.id), [allRules, project.id]);

  const graphData = useMemo(() => {
    const nodes: GraphNode[] = [];
    const links: { source: string; target: string }[] = [];
    const pid = `project-${project.id}`;

    nodes.push({ id: pid, name: project.name, type: 'project', val: 12, entityId: project.id });

    for (const agent of agents) {
      const id = `agent-${agent.id}`;
      nodes.push({ id, name: agent.name, type: 'agent', val: 6, entityId: agent.id });
      links.push({ source: pid, target: id });
    }
    for (const task of tasks) {
      const id = `task-${task.id}`;
      nodes.push({ id, name: task.name, type: 'task', val: 4, entityId: task.id });
      links.push({ source: pid, target: id });
    }
    for (const memory of memories) {
      const id = `memory-${memory.id}`;
      nodes.push({ id, name: memory.name ?? 'Unnamed', type: 'memory', val: 4, entityId: memory.id });
      links.push({ source: pid, target: id });
    }
    for (const rule of projectRules) {
      const id = `rule-${rule.id}`;
      nodes.push({ id, name: rule.name, type: 'rule', val: 4, entityId: rule.id });
      links.push({ source: pid, target: id });
    }

    return { nodes, links };
  }, [project.id, project.name, agents, tasks, memories, projectRules]);

  // Keep graphDataRef in sync so the init effect can read it without depending on it
  useEffect(() => {
    graphDataRef.current = graphData;
  }, [graphData]);

  // ─── Resize observer ───────────────────────────────────────────────────────

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout>;
    const observer = new ResizeObserver(([entry]) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }, 60);
    });
    observer.observe(el);
    setDimensions({ width: el.clientWidth, height: el.clientHeight });
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  // ─── Graph init (once per dimension set) ───────────────────────────────────

  useEffect(() => {
    const el = canvasRef.current;
    if (!el || dimensions.width === 0) return;

    el.innerHTML = '';

    const isDark = document.documentElement.classList.contains('dark');
    const labelColor = isDark ? 'rgba(248,250,252,0.9)' : 'rgba(15,23,42,0.9)';
    const linkColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

    const graph = new ForceGraph(el)
      .width(dimensions.width)
      .height(dimensions.height)
      .backgroundColor('rgba(0,0,0,0)')
      .nodeId('id')
      .nodeVal('val')
      .nodeColor((node: NodeObject) => NODE_CONFIG[(node as GraphNode).type].color)
      .nodeCanvasObject((node: NodeObject, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const n = node as GraphNode;
        const cfg = NODE_CONFIG[n.type];
        const r = cfg.radius;
        const x = n.x ?? 0;
        const y = n.y ?? 0;

        // Node circle
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = cfg.color;
        ctx.fill();

        // Glow ring on project node
        if (n.type === 'project') {
          ctx.shadowColor = cfg.color;
          ctx.shadowBlur = 16;
          ctx.strokeStyle = 'rgba(255,255,255,0.25)';
          ctx.lineWidth = 1.5 / globalScale;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Label — visible above a zoom threshold
        if (globalScale >= 0.5) {
          const fs = Math.min(13, Math.max(8, 10 / globalScale));
          ctx.font = `${n.type === 'project' ? '600' : '400'} ${fs}px Inter, system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillStyle = labelColor;
          const label = n.name.length > 24 ? `${n.name.slice(0, 22)}…` : n.name;
          ctx.fillText(label, x, y + r + 3 / globalScale);
        }
      })
      .nodeCanvasObjectMode(() => 'replace')
      // Expand hit area slightly beyond visible radius for easier clicking
      .nodePointerAreaPaint((node: NodeObject, color: string, ctx: CanvasRenderingContext2D) => {
        const n = node as GraphNode;
        ctx.beginPath();
        ctx.arc(n.x ?? 0, n.y ?? 0, NODE_CONFIG[n.type].radius + 4, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
      })
      .linkColor(() => linkColor)
      .linkWidth(1)
      .onNodeClick((node: object) => {
        const n = node as GraphNode;
        if (n.type === 'rule') navigateRef.current(`/rules/${n.entityId}`);
        else if (n.type === 'agent') navigateRef.current(`/agents/${n.entityId}`);
        else if (n.type === 'memory') navigateRef.current('/memory');
        else if (n.type === 'task') navigateRef.current(`/projects/${projectIdRef.current}`);
      })
      .cooldownTicks(120)
      .d3AlphaDecay(0.02)
      .d3VelocityDecay(0.3)
      .graphData(graphDataRef.current);

    graphRef.current = graph;

    return () => {
      el.innerHTML = '';
      graphRef.current = null;
    };
  }, [dimensions]);

  // ─── Live data updates ─────────────────────────────────────────────────────

  useEffect(() => {
    graphRef.current?.graphData(graphData);
  }, [graphData]);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">
      {/* Legend + hint */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {LEGEND.map(({ type, label }) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: NODE_CONFIG[type].color }} />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
        <p className="ml-auto text-[11px] text-muted-foreground/60">Scroll to zoom · Drag to pan · Click to navigate</p>
      </div>

      {/* Canvas */}
      <div ref={wrapperRef} className="h-[540px] overflow-hidden rounded-xl border bg-muted/10">
        <div ref={canvasRef} className="h-full w-full" />
      </div>
    </div>
  );
}
