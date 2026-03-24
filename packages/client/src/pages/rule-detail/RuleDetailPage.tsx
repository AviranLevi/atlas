// React / library
import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ScrollText, Pencil, FileText, Bot } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EditableCard } from '@/components/agents/EditableCard';
import { RuleDialog } from '@/components/rules/RuleDialog';

// Hooks
import { useRuleDetail } from '@/hooks/use-rule-detail.hook';
import { useUpdateRule } from '@/hooks/use-rules.hook';
import { useProjects } from '@/hooks/use-projects.hook';

export function RuleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: detail, isLoading } = useRuleDetail(id);
  const { data: projects = [] } = useProjects();
  const updateRule = useUpdateRule();

  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading rule...</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <p className="text-muted-foreground text-sm">Rule not found</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/rules')}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Rules
        </Button>
      </div>
    );
  }

  const { rule, agents } = detail;
  const projectName = rule.projectId
    ? projects.find((p) => p.id === rule.projectId)?.name
    : null;

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" className="w-fit" onClick={() => navigate('/rules')}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Rules
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
              <ScrollText className="text-primary h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{rule.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {rule.type}
                </Badge>
                {projectName && (
                  <Badge variant="outline" className="text-xs">
                    Project: {projectName}
                  </Badge>
                )}
                {rule.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-1.5 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      {/* Inline editable card */}
      <EditableCard
        icon={FileText}
        label="Content"
        value={rule.content}
        placeholder="Click to define coding standards and conventions..."
        isPending={updateRule.isPending}
        onSave={(val) => updateRule.mutate({ id: rule.id, data: { content: val } })}
      />

      {/* Used by Agents */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Bot className="h-4 w-4 text-muted-foreground" />
          Used by Agents
        </div>
        {agents.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <p className="text-muted-foreground text-xs italic">
              No agents are using this rule yet.
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

      <RuleDialog open={editOpen} onOpenChange={setEditOpen} rule={rule} />
    </div>
  );
}
