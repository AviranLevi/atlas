// React / library
import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Zap, Pencil, ListOrdered, LogIn, LogOut, Bot } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EditableCard } from '@/components/agents/EditableCard';
import { SkillDialog } from '@/components/skills/SkillDialog';

// Hooks
import { useSkillDetail } from '@/hooks/use-skill-detail.hook';
import { useUpdateSkill } from '@/hooks/use-skills.hook';
import { useProjects } from '@/hooks/use-projects.hook';

export function SkillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: detail, isLoading } = useSkillDetail(id);
  const { data: projects = [] } = useProjects();
  const updateSkill = useUpdateSkill();

  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading skill...</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <p className="text-muted-foreground text-sm">Skill not found</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/skills')}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Skills
        </Button>
      </div>
    );
  }

  const { skill, agents } = detail;
  const projectName = skill.projectId
    ? projects.find((p) => p.id === skill.projectId)?.name
    : null;

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" className="w-fit" onClick={() => navigate('/skills')}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Skills
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
              <Zap className="text-primary h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{skill.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {skill.type}
                </Badge>
                {projectName && (
                  <Badge variant="outline" className="text-xs">
                    Project: {projectName}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-1.5 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      {/* Inline editable cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <EditableCard
          icon={ListOrdered}
          label="Steps"
          value={skill.steps}
          placeholder="Click to define step-by-step instructions..."
          isPending={updateSkill.isPending}
          onSave={(val) => updateSkill.mutate({ id: skill.id, data: { steps: val } })}
        />
        <EditableCard
          icon={LogIn}
          label="Input Format"
          value={skill.inputFormat}
          placeholder="Click to define expected input structure..."
          isPending={updateSkill.isPending}
          onSave={(val) => updateSkill.mutate({ id: skill.id, data: { inputFormat: val } })}
        />
        <EditableCard
          icon={LogOut}
          label="Output Format"
          value={skill.outputFormat}
          placeholder="Click to define expected output structure..."
          isPending={updateSkill.isPending}
          onSave={(val) => updateSkill.mutate({ id: skill.id, data: { outputFormat: val } })}
        />
      </div>

      {/* Used by Agents */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Bot className="h-4 w-4 text-muted-foreground" />
          Used by Agents
        </div>
        {agents.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <p className="text-muted-foreground text-xs italic">
              No agents are using this skill yet.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {agents.map((agent) => (
              <Link key={agent.id} to={`/agents/${agent.id}`}>
                <Badge
                  variant="secondary"
                  className="cursor-pointer text-xs hover:bg-secondary/80"
                >
                  {agent.name}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>

      <SkillDialog open={editOpen} onOpenChange={setEditOpen} skill={skill} />
    </div>
  );
}
