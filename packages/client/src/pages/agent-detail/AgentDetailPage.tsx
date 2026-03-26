// React / library
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bot, Pencil, Sparkles, BookOpen } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AgentDialog } from '@/components/agents/AgentDialog';
import { EditableCard } from '@/components/ui/editable-card';
import { DefaultModelSelector } from './DefaultModelSelector';
import { AttachableItemsSection } from './AttachableItemsSection';
import { AssignedProjectsSection } from './AssignedProjectsSection';

// Hooks
import { useUpdateAgent } from '@/hooks/use-agents.hook';
import { useAgentDetail, useAttachSkill, useDetachSkill, useAttachRule, useDetachRule } from '@/hooks/use-agents.hook';
import { useSkills } from '@/hooks/use-skills.hook';
import { useRules } from '@/hooks/use-rules.hook';
import { useAgentProviders } from '@/hooks/use-agent-providers.hook';

export function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: detail, isLoading } = useAgentDetail(id);
  const { data: allSkills = [] } = useSkills();
  const { data: allRules = [] } = useRules();
  const { data: providers = [] } = useAgentProviders();
  const updateAgent = useUpdateAgent();
  const attachSkill = useAttachSkill();
  const detachSkill = useDetachSkill();
  const attachRule = useAttachRule();
  const detachRule = useDetachRule();

  const [editOpen, setEditOpen] = useState(false);
  const [skillPopoverOpen, setSkillPopoverOpen] = useState(false);
  const [rulePopoverOpen, setRulePopoverOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading agent...</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <p className="text-muted-foreground text-sm">Agent not found</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/agents')}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Agents
        </Button>
      </div>
    );
  }

  const { agent, skills, rules, projects } = detail;
  const provider = providers.find((p) => p.id === agent.providerId);

  const attachedSkillIds = new Set(skills.map((s) => s.id));
  const unattachedSkills = allSkills.filter((s) => !attachedSkillIds.has(s.id));

  const attachedRuleIds = new Set(rules.map((r) => r.id));
  const unattachedRules = allRules.filter((r) => !attachedRuleIds.has(r.id));

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" className="w-fit" onClick={() => navigate('/agents')}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Agents
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
              <Bot className="text-primary h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{agent.name}</h1>
              {agent.description && (
                <p className="text-muted-foreground mt-1 text-sm">{agent.description}</p>
              )}
              {provider && (
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {provider.name}
                  </Badge>
                  {provider.modelName && (
                    <Badge variant="outline" className="text-xs font-mono">
                      {provider.modelName}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-1.5 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      {/* Personality, Rules & Model */}
      <div className="grid gap-4 sm:grid-cols-2">
        <EditableCard
          icon={Sparkles}
          label="Personality"
          value={agent.personality}
          placeholder="Click to define how this agent should behave and communicate..."
          isPending={updateAgent.isPending}
          onSave={(val) => updateAgent.mutate({ id: agent.id, data: { personality: val } })}
        />
        <EditableCard
          icon={BookOpen}
          label="Unbreakable Rules"
          value={agent.unbreakableRules}
          placeholder="Click to define rules this agent must never break..."
          isPending={updateAgent.isPending}
          onSave={(val) => updateAgent.mutate({ id: agent.id, data: { unbreakableRules: val } })}
        />
        <DefaultModelSelector
          value={agent.defaultModel}
          provider={provider}
          isPending={updateAgent.isPending}
          onSave={(val) => updateAgent.mutate({ id: agent.id, data: { defaultModel: val } })}
        />
      </div>

      <AttachableItemsSection
        icon={Sparkles}
        label="Skills"
        items={skills}
        unattachedItems={unattachedSkills}
        popoverOpen={skillPopoverOpen}
        onPopoverOpenChange={setSkillPopoverOpen}
        onAttach={(skillId) => attachSkill.mutate({ agentId: agent.id, skillId })}
        onDetach={(skillId) => detachSkill.mutate({ agentId: agent.id, skillId })}
        attachLabel="Attach Skill"
        emptyMessage="No skills attached yet."
        badgeVariant="secondary"
      />

      <AttachableItemsSection
        icon={BookOpen}
        label="Rules"
        items={rules}
        unattachedItems={unattachedRules}
        popoverOpen={rulePopoverOpen}
        onPopoverOpenChange={setRulePopoverOpen}
        onAttach={(ruleId) => attachRule.mutate({ agentId: agent.id, ruleId })}
        onDetach={(ruleId) => detachRule.mutate({ agentId: agent.id, ruleId })}
        attachLabel="Attach Rule"
        emptyMessage="No rules attached yet."
        badgeVariant="outline"
      />

      <AssignedProjectsSection projects={projects} />
      <AgentDialog open={editOpen} onOpenChange={setEditOpen} agent={agent} />
    </div>
  );
}
