// React / library
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Settings } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { McpConnectionPanel } from '@/components/settings/McpConnectionPanel';
import { GlobalInstructionsCard } from './GlobalInstructionsCard';
import { DispatchRulesCard } from './DispatchRulesCard';

// Hooks
import {
  useGlobalInstructions,
  useUpdateGlobalInstructions,
  useDispatchRules,
  useCreateDispatchRule,
  useUpdateDispatchRule,
  useDeleteDispatchRule,
} from '@/hooks/use-settings.hook';
import { useAgents } from '@/hooks/use-agents.hook';
import { useSkills } from '@/hooks/use-skills.hook';

// Types
import type { DispatchRule } from '@my-agents/shared';
import type { RuleForm } from './settings-page.types';

// Constants
import { NONE_SKILL_VALUE, emptyRuleForm } from './settings-page.constants';

const VALID_TABS = ['general', 'dispatch-rules', 'mcp'] as const;
type SettingsTab = (typeof VALID_TABS)[number];

function isValidTab(value: string | null): value is SettingsTab {
  return VALID_TABS.includes(value as SettingsTab);
}

export function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const activeTab: SettingsTab = isValidTab(rawTab) ? rawTab : 'general';

  const { data: globalInstructions, isLoading: instructionsLoading } = useGlobalInstructions();
  const updateInstructions = useUpdateGlobalInstructions();
  const { data: rules = [], isLoading: rulesLoading } = useDispatchRules();
  const createRule = useCreateDispatchRule();
  const updateRule = useUpdateDispatchRule();
  const deleteRule = useDeleteDispatchRule();
  const { data: agents = [] } = useAgents();
  const { data: skills = [] } = useSkills();

  const [instructions, setInstructions] = useState('');
  const [instructionsDirty, setInstructionsDirty] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleForm, setRuleForm] = useState<RuleForm>(emptyRuleForm);
  const [deleteRuleId, setDeleteRuleId] = useState<string | null>(null);

  useEffect(() => {
    if (globalInstructions?.content !== undefined) {
      setInstructions(globalInstructions.content);
      setInstructionsDirty(false);
    }
  }, [globalInstructions?.content]);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  const getAgentName = (id: string) => agents.find((a) => a.id === id)?.name ?? 'Unknown';
  const getSkillName = (id: string | null) => (id ? skills.find((s) => s.id === id)?.name ?? '—' : '—');

  const handleCancelEdit = () => {
    setEditingRuleId(null);
    setRuleForm(emptyRuleForm);
  };

  const handleSaveRule = () => {
    const payload = {
      pattern: ruleForm.pattern,
      agentId: ruleForm.agentId,
      skillId: ruleForm.skillId === NONE_SKILL_VALUE ? null : ruleForm.skillId,
    };
    if (editingRuleId === 'new') {
      createRule.mutate(payload, { onSuccess: handleCancelEdit });
    } else if (editingRuleId) {
      updateRule.mutate({ id: editingRuleId, data: payload }, { onSuccess: handleCancelEdit });
    }
  };

  const isRuleFormValid = ruleForm.pattern.trim() !== '' && ruleForm.agentId !== '';

  const dispatchError = createRule.isError
    ? (createRule.error?.message ?? 'Failed to create rule')
    : updateRule.isError
      ? (updateRule.error?.message ?? 'Failed to update rule')
      : deleteRule.isError
        ? (deleteRule.error?.message ?? 'Failed to delete rule')
        : null;

  const instructionsError = updateInstructions.isError
    ? (updateInstructions.error?.message ?? 'Failed to save instructions')
    : null;

  return (
    <div>
      <div className="mb-8 flex items-center gap-3">
        <Settings className="h-8 w-8 text-muted-foreground" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">Configure global instructions, dispatch rules, and MCP connections</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="dispatch-rules">Dispatch Rules</TabsTrigger>
          <TabsTrigger value="mcp">MCP Connection</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <GlobalInstructionsCard
            instructions={instructions}
            isLoading={instructionsLoading}
            isDirty={instructionsDirty}
            isSaving={updateInstructions.isPending}
            isSaved={updateInstructions.isSuccess}
            error={instructionsError}
            onChange={(v) => { setInstructions(v); setInstructionsDirty(true); }}
            onSave={() => {
              if (!instructionsDirty) return;
              updateInstructions.mutate({ content: instructions }, {
                onSuccess: () => setInstructionsDirty(false),
              });
            }}
          />
        </TabsContent>

        <TabsContent value="dispatch-rules" className="mt-6">
          <DispatchRulesCard
            rules={rules}
            isLoading={rulesLoading}
            agents={agents}
            skills={skills}
            editingRuleId={editingRuleId}
            ruleForm={ruleForm}
            isFormValid={isRuleFormValid}
            isSaving={createRule.isPending || updateRule.isPending}
            error={dispatchError}
            onFormChange={setRuleForm}
            onAdd={() => { setRuleForm(emptyRuleForm); setEditingRuleId('new'); }}
            onEdit={(rule: DispatchRule) => {
              setRuleForm({ pattern: rule.pattern, agentId: rule.agentId, skillId: rule.skillId ?? NONE_SKILL_VALUE });
              setEditingRuleId(rule.id);
            }}
            onDelete={(id) => setDeleteRuleId(id)}
            onSave={handleSaveRule}
            onCancel={handleCancelEdit}
            getAgentName={getAgentName}
            getSkillName={getSkillName}
          />
        </TabsContent>

        <TabsContent value="mcp" className="mt-6">
          <McpConnectionPanel />
        </TabsContent>
      </Tabs>

      <Dialog open={!!deleteRuleId} onOpenChange={() => setDeleteRuleId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete dispatch rule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this dispatch rule? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteRuleId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => { if (deleteRuleId) { deleteRule.mutate(deleteRuleId); setDeleteRuleId(null); } }}
              disabled={deleteRule.isPending}
            >
              {deleteRule.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
