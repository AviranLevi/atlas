import { useState, useEffect } from 'react';
import type { DispatchRule } from '@my-agents/shared';
import { Settings, Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { McpConnectionPanel } from '@/components/settings/McpConnectionPanel';

import type { RuleForm } from './settings-page.types';
import { NONE_SKILL_VALUE, emptyRuleForm } from './settings-page.constants';

export function SettingsPage() {
  const { data: globalInstructions, isLoading: instructionsLoading } =
    useGlobalInstructions();
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

  const getAgentName = (id: string) =>
    agents.find((a) => a.id === id)?.name ?? 'Unknown';
  const getSkillName = (id: string | null) =>
    id ? skills.find((s) => s.id === id)?.name ?? '—' : '—';

  const handleInstructionsChange = (value: string) => {
    setInstructions(value);
    setInstructionsDirty(true);
  };

  const handleSaveInstructions = () => {
    if (!instructionsDirty) return;
    updateInstructions.mutate(
      { content: instructions },
      {
        onSuccess: () => setInstructionsDirty(false),
      }
    );
  };

  const handleAddRule = () => {
    setRuleForm(emptyRuleForm);
    setEditingRuleId('new');
  };

  const handleEditRule = (rule: DispatchRule) => {
    setRuleForm({
      pattern: rule.pattern,
      agentId: rule.agentId,
      skillId: rule.skillId ?? NONE_SKILL_VALUE,
    });
    setEditingRuleId(rule.id);
  };

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
      updateRule.mutate(
        { id: editingRuleId, data: payload },
        { onSuccess: handleCancelEdit }
      );
    }
  };

  const handleDeleteRule = (id: string) => {
    setDeleteRuleId(id);
  };

  const confirmDeleteRule = () => {
    if (deleteRuleId) {
      deleteRule.mutate(deleteRuleId);
      setDeleteRuleId(null);
    }
  };

  const isRuleFormValid =
    ruleForm.pattern.trim() !== '' && ruleForm.agentId !== '';

  return (
    <div>
      <div className="mb-8 flex items-center gap-3">
        <Settings className="h-8 w-8 text-muted-foreground" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Global instructions and dispatch rules
          </p>
        </div>
      </div>

      <div className="space-y-8">
        <McpConnectionPanel />

        <Card>
          <CardHeader>
            <CardTitle>Global Instructions</CardTitle>
            <CardDescription>
              Instructions that apply to every agent regardless of project
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {instructionsLoading ? (
              <div className="text-muted-foreground py-8 text-center">
                Loading...
              </div>
            ) : (
              <>
                <Textarea
                  value={instructions}
                  onChange={(e) => handleInstructionsChange(e.target.value)}
                  rows={12}
                  placeholder="Enter global instructions..."
                  className="resize-none"
                />
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleSaveInstructions}
                    disabled={!instructionsDirty || updateInstructions.isPending}
                  >
                    {updateInstructions.isPending ? (
                      <>
                        <Save className="mr-2 h-4 w-4 animate-pulse" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save
                      </>
                    )}
                  </Button>
                  {!instructionsDirty &&
                    !updateInstructions.isPending &&
                    updateInstructions.isSuccess && (
                      <span className="text-muted-foreground text-sm">
                        Saved!
                      </span>
                    )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Dispatch Rules</CardTitle>
              <CardDescription>
                Define which agent handles which patterns
              </CardDescription>
            </div>
            <Button onClick={handleAddRule} disabled={editingRuleId === 'new'}>
              <Plus className="mr-2 h-4 w-4" />
              Add Rule
            </Button>
          </CardHeader>
          <CardContent>
            {rulesLoading ? (
              <div className="text-muted-foreground py-8 text-center">
                Loading...
              </div>
            ) : (
              <div className="rounded-md border">
                <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 border-b bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground">
                  <div>Pattern</div>
                  <div>Agent</div>
                  <div>Skill</div>
                  <div />
                </div>
                {rules.map((rule) =>
                  editingRuleId === rule.id ? (
                    <div
                      key={rule.id}
                      className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 border-b px-4 py-3 last:border-b-0"
                    >
                      <Input
                        value={ruleForm.pattern}
                        onChange={(e) =>
                          setRuleForm((f) => ({ ...f, pattern: e.target.value }))
                        }
                        placeholder="Pattern"
                      />
                      <Select
                        value={ruleForm.agentId}
                        onValueChange={(v) =>
                          setRuleForm((f) => ({ ...f, agentId: v }))
                        }
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
                        value={ruleForm.skillId}
                        onValueChange={(v) =>
                          setRuleForm((f) => ({ ...f, skillId: v }))
                        }
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
                          onClick={handleSaveRule}
                          disabled={
                            !isRuleFormValid ||
                            updateRule.isPending ||
                            createRule.isPending
                          }
                          aria-label="Save"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={handleCancelEdit}
                          aria-label="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      key={rule.id}
                      className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 border-b px-4 py-3 last:border-b-0"
                    >
                      <div className="flex items-center text-sm">
                        {rule.pattern}
                      </div>
                      <div className="flex items-center text-sm">
                        {getAgentName(rule.agentId)}
                      </div>
                      <div className="flex items-center text-sm">
                        {getSkillName(rule.skillId)}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEditRule(rule)}
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteRule(rule.id)}
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                )}
                {editingRuleId === 'new' && (
                  <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 border-b px-4 py-3 last:border-b-0">
                    <Input
                      value={ruleForm.pattern}
                      onChange={(e) =>
                        setRuleForm((f) => ({ ...f, pattern: e.target.value }))
                      }
                      placeholder="Pattern"
                    />
                    <Select
                      value={ruleForm.agentId}
                      onValueChange={(v) =>
                        setRuleForm((f) => ({ ...f, agentId: v }))
                      }
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
                      value={ruleForm.skillId}
                      onValueChange={(v) =>
                        setRuleForm((f) => ({ ...f, skillId: v }))
                      }
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
                        onClick={handleSaveRule}
                        disabled={
                          !isRuleFormValid ||
                          createRule.isPending ||
                          updateRule.isPending
                        }
                        aria-label="Save"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleCancelEdit}
                        aria-label="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!deleteRuleId} onOpenChange={() => setDeleteRuleId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete dispatch rule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this dispatch rule? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteRuleId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteRule}
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
