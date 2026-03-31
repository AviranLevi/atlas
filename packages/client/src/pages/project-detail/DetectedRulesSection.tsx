// React / library
import { useState, useMemo, type ReactElement } from 'react';
import { FileText, Download, Check, ChevronDown, ChevronRight } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

// Hooks
import { useImportProjectRules } from '@/hooks/use-projects.hook';

// Types
import type { DetectedRulesSectionProps } from './project-detail-page.types';

// Constants
import { SOURCE_LABELS } from './project-detail-page.constants';

export function DetectedRulesSection({ projectId, aiConfigs }: DetectedRulesSectionProps): ReactElement {
  const importRules = useImportProjectRules(projectId);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(aiConfigs.map((c) => c.filePath)));
  const [expandedFile, setExpandedFile] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState<number | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof aiConfigs>();
    for (const config of aiConfigs) {
      const group = map.get(config.source) ?? [];
      group.push(config);
      map.set(config.source, group);
    }
    return map;
  }, [aiConfigs]);

  const toggleSelect = (filePath: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(filePath)) next.delete(filePath);
      else next.add(filePath);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === aiConfigs.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(aiConfigs.map((c) => c.filePath)));
    }
  };

  const handleImport = () => {
    const items = aiConfigs.filter((c) => selected.has(c.filePath));
    importRules.mutate(items, {
      onSuccess: (data) => {
        setImportedCount(data.imported);
        setSelected(new Set());
      },
    });
  };

  if (importedCount !== null) {
    return (
      <Card className="flex items-center gap-3 p-4 border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
        <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
        <div>
          <p className="text-sm font-medium text-green-700 dark:text-green-300">
            Imported {importedCount} rule{importedCount !== 1 ? 's' : ''} successfully
          </p>
          <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-0.5">
            Rules are now available in the Rules page, linked to this project.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">
            Detected AI Rules ({aiConfigs.length})
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={toggleAll}>
            {selected.size === aiConfigs.length ? 'Deselect All' : 'Select All'}
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            disabled={selected.size === 0 || importRules.isPending}
            onClick={handleImport}
          >
            <Download className="h-3 w-3 mr-1.5" />
            {importRules.isPending
              ? 'Importing...'
              : `Import ${selected.size} Rule${selected.size !== 1 ? 's' : ''}`}
          </Button>
        </div>
      </div>

      {importRules.isError && (
        <div className="px-4 py-2 text-xs text-destructive bg-destructive/5 border-b">
          {(importRules.error as Error).message}
        </div>
      )}

      <div className="divide-y">
        {[...grouped.entries()].map(([source, configs]) => (
          <div key={source} className="px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {SOURCE_LABELS[source] ?? source}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {configs.length} file{configs.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-1">
              {configs.map((config) => {
                const isExpanded = expandedFile === config.filePath;
                return (
                  <div key={config.filePath}>
                    <div className="flex items-center gap-2 py-1 group">
                      <Checkbox
                        checked={selected.has(config.filePath)}
                        onCheckedChange={() => toggleSelect(config.filePath)}
                      />
                      <button
                        type="button"
                        className="flex items-center gap-1.5 flex-1 text-left min-w-0"
                        onClick={() => setExpandedFile(isExpanded ? null : config.filePath)}
                      >
                        {isExpanded
                          ? <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                          : <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
                        <span className="text-sm font-medium truncate">{config.name}</span>
                        <span className="text-xs text-muted-foreground truncate ml-1">
                          {config.filePath}
                        </span>
                      </button>
                    </div>
                    {isExpanded && (
                      <pre className="ml-8 mt-1 mb-2 p-3 rounded-md bg-muted/50 text-xs overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap wrap-break-word">
                        {config.content.slice(0, 2000)}
                        {config.content.length > 2000 && '\n... (truncated)'}
                      </pre>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
