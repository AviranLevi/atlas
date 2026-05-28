// React / library
import { ScrollText, Plus, Trash2, Search, FolderOpen, Upload, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Components
import { EmptyState } from '@/components/empty-state/EmptyState';
import { ImportPackageDialog } from '@/components/packages/ImportPackageDialog';
import { RuleDialog } from '@/components/rules/RuleDialog';
import { RuleTemplatesDialog } from '@/components/rules/RuleTemplatesDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Context
import { useActiveProject } from '@/contexts/ProjectContext';

// Hooks
import { useRules, useDeleteRule } from '@/hooks/use-rules.hook';

// Lib
import { timeAgo, contentPreview } from '@/lib/format';

// Types
import type { Rule } from '@atlas/shared';

// Constants
import { RULE_TYPE_OPTIONS, RULE_TYPE_COLORS } from './rules.constants';
import { TOUR_TARGETS } from '@/lib/tours/tour-targets';

export function RulesPage() {
  const navigate = useNavigate();
  const { activeProjectId, projects } = useActiveProject();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filters = typeFilter && typeFilter !== 'all' ? { type: typeFilter } : undefined;
  const { data: rules = [], isLoading } = useRules(filters);
  const deleteRule = useDeleteRule();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteRuleId, setDeleteRuleId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);

  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p.name])), [projects]);

  const filtered = useMemo(() => {
    let result = rules;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((r) => r.name.toLowerCase().includes(q));
    }

    if (activeProjectId) {
      result = result.filter((r) => r.projectId === activeProjectId || !r.projectId);
    }

    return result;
  }, [rules, search, activeProjectId]);

  const grouped = useMemo(() => {
    if (typeFilter !== 'all') return null;
    const map = new Map<string, Rule[]>();
    for (const rule of filtered) {
      const group = map.get(rule.type) ?? [];
      group.push(rule);
      map.set(rule.type, group);
    }
    return map;
  }, [filtered, typeFilter]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteRuleId(id);
  };

  const renderCard = (rule: Rule) => {
    const borderColor = RULE_TYPE_COLORS[rule.type] ?? 'border-l-gray-300';
    const preview = contentPreview(rule.content);

    return (
      <Card
        key={rule.id}
        className={`group relative flex cursor-pointer flex-col gap-2 border-l-[3px] p-4 transition-shadow hover:shadow-md ${borderColor}`}
        onClick={() => navigate(`/rules/${rule.id}`)}
      >
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
            <ScrollText className="text-primary h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold">{rule.name}</h3>
            <div className="mt-1 flex flex-wrap gap-1">
              <Badge variant="secondary" className="text-[11px]">
                {rule.type}
              </Badge>
              {rule.projectId && projectMap.get(rule.projectId) && (
                <Badge variant="outline" className="text-[10px]">
                  <FolderOpen className="mr-0.5 h-2.5 w-2.5" />
                  {projectMap.get(rule.projectId)}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {preview && <p className="line-clamp-2 text-xs text-muted-foreground">{preview}</p>}

        {rule.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {rule.tags.map((tag: string) => (
              <Badge key={tag} variant="outline" className="text-[11px]">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">{timeAgo(rule.updatedAt)}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={(e) => handleDelete(rule.id, e)}
            aria-label="Delete rule"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rules</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">Coding standards and conventions for agents</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            data-tour={TOUR_TARGETS.rulesTemplates}
            variant="outline"
            size="sm"
            onClick={() => setTemplatesOpen(true)}
          >
            <Sparkles className="mr-1.5 h-4 w-4" />
            Templates
          </Button>
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <Upload className="mr-1.5 h-4 w-4" />
            Import
          </Button>
          <Button data-tour={TOUR_TARGETS.rulesNewBtn} onClick={() => setDialogOpen(true)} size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            New Rule
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rules..."
            className="h-8 pl-8 text-xs"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-8 w-[140px] text-xs">
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
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No rules found"
          body={
            search
              ? 'Try adjusting your filters.'
              : 'Rules are coding standards and conventions agents must follow. Start from a template or write your own.'
          }
          primaryCta={!search ? { label: 'Create Rule', onClick: () => setDialogOpen(true), icon: Plus } : undefined}
          secondaryCta={
            !search ? { label: 'Browse templates', onClick: () => setTemplatesOpen(true), icon: Sparkles } : undefined
          }
        />
      ) : grouped ? (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([typeName, typeRules]) => (
            <div key={typeName}>
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
                {typeName} ({typeRules.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{typeRules.map(renderCard)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filtered.map(renderCard)}</div>
      )}

      <RuleDialog open={dialogOpen} onOpenChange={setDialogOpen} onCreated={(rule) => navigate(`/rules/${rule.id}`)} />

      <ImportPackageDialog open={importOpen} onOpenChange={setImportOpen} />

      <RuleTemplatesDialog open={templatesOpen} onOpenChange={setTemplatesOpen} />

      <ConfirmDeleteDialog
        open={!!deleteRuleId}
        onOpenChange={(open) => !open && setDeleteRuleId(null)}
        title="Delete rule"
        description="This will permanently delete the rule. This action cannot be undone."
        isPending={deleteRule.isPending}
        onConfirm={() => {
          if (deleteRuleId) {
            deleteRule.mutate(deleteRuleId, { onSuccess: () => setDeleteRuleId(null) });
          }
        }}
      />
    </div>
  );
}
