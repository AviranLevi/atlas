// React / library
import { Plus, Pencil, Trash2, Zap } from 'lucide-react';

// Components
import { EmptyState } from '@/components/empty-state/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { DispatchRuleFormRow } from './DispatchRuleFormRow';

// Types
import type { DispatchRulesCardProps } from '../settings.types';

export function DispatchRulesCard({
  rules,
  isLoading,
  agents,
  skills,
  editingRuleId,
  ruleForm,
  isFormValid,
  isSaving,
  error,
  onFormChange,
  onAdd,
  onEdit,
  onDelete,
  onSave,
  onCancel,
  getAgentName,
  getSkillName,
}: DispatchRulesCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Dispatch Rules</CardTitle>
          <CardDescription>
            Rules are matched against task names when tasks are created. The first matching rule auto-assigns the agent
            and skill.
          </CardDescription>
        </div>
        <Button onClick={onAdd} disabled={editingRuleId === 'new'}>
          <Plus className="mr-2 h-4 w-4" />
          Add Rule
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-muted-foreground py-8 text-center">Loading...</div>
        ) : rules.length === 0 && editingRuleId !== 'new' ? (
          <EmptyState
            icon={Zap}
            title="No dispatch rules"
            body="Dispatch rules auto-route new tasks to agents based on the task name (regex). Powerful, but only fires when you've set rules up — most users never discover this."
            primaryCta={{ label: 'Add Rule', onClick: onAdd, icon: Plus }}
            compact
          />
        ) : (
          <div className="rounded-md border">
            <div className="grid grid-cols-[1fr_1fr_1fr_auto_auto] gap-4 border-b bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground">
              <div>Pattern</div>
              <div>Agent</div>
              <div>Skill</div>
              <div>
                <Zap className="h-3.5 w-3.5" />
              </div>
              <div />
            </div>

            {rules.map((rule) =>
              editingRuleId === rule.id ? (
                <DispatchRuleFormRow
                  key={rule.id}
                  form={ruleForm}
                  agents={agents}
                  skills={skills}
                  isSaving={isSaving}
                  isValid={isFormValid}
                  onChange={onFormChange}
                  onSave={onSave}
                  onCancel={onCancel}
                />
              ) : (
                <div
                  key={rule.id}
                  className="grid grid-cols-[1fr_1fr_1fr_auto_auto] gap-4 border-b px-4 py-3 last:border-b-0"
                >
                  <div className="flex items-center text-sm">
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{rule.pattern}</code>
                  </div>
                  <div className="flex items-center text-sm">{getAgentName(rule.agentId)}</div>
                  <div className="flex items-center text-sm">{getSkillName(rule.skillId)}</div>
                  <div className="flex items-center">
                    {rule.autoStart && <Zap className="h-4 w-4 text-yellow-500" aria-label="Auto-start enabled" />}
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => onEdit(rule)} aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => onDelete(rule.id)} aria-label="Delete">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ),
            )}

            {editingRuleId === 'new' && (
              <DispatchRuleFormRow
                form={ruleForm}
                agents={agents}
                skills={skills}
                isSaving={isSaving}
                isValid={isFormValid}
                onChange={onFormChange}
                onSave={onSave}
                onCancel={onCancel}
              />
            )}
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
