import { useState } from 'react';
import type { Rule } from '@my-agents/shared';
import { ScrollText, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRules, useDeleteRule } from '@/hooks/use-rules.hook';
import { RuleDialog } from '@/components/rules/RuleDialog';
import { RULE_TYPE_OPTIONS } from './rules-page.constants';

export function RulesPage() {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const filters = typeFilter && typeFilter !== 'all' ? { type: typeFilter } : undefined;
  const { data: rules, isLoading } = useRules(filters);
  const deleteRule = useDeleteRule();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | undefined>();

  const handleCreate = () => {
    setEditingRule(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (rule: Rule) => {
    setEditingRule(rule);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this rule?')) {
      deleteRule.mutate(id);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rules</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">Coding standards and conventions for agents</p>
        </div>
        <Button onClick={handleCreate} size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          New Rule
        </Button>
      </div>

      <div className="mb-4">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-8 w-[160px] text-xs">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            {RULE_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground py-12 text-center text-sm">Loading...</div>
      ) : !rules?.length ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <ScrollText className="text-muted-foreground mx-auto mb-4 h-10 w-10" />
          <h3 className="mb-1 text-base font-medium">No rules yet</h3>
          <p className="text-muted-foreground mb-4 text-sm">Create your first rule to get started.</p>
          <Button onClick={handleCreate} variant="outline" size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            Create Rule
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rules.map((rule) => (
            <Card
              key={rule.id}
              className="group relative flex flex-col gap-2 p-4 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
                  <ScrollText className="text-primary h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold">{rule.name}</h3>
                  <Badge variant="secondary" className="mt-1 text-[11px]">
                    {rule.type}
                  </Badge>
                </div>
              </div>

              {rule.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {rule.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-[11px]">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="absolute right-2 top-2 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(rule)} aria-label="Edit rule">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(rule.id)} aria-label="Delete rule">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <RuleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        rule={editingRule}
      />
    </div>
  );
}
