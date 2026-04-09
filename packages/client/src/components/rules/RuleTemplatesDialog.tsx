// React / library
import { Check, Sparkles } from 'lucide-react';
import { useState } from 'react';

// Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Hooks
import { useProjects } from '@/hooks/use-projects.hook';
import { useCreateRule } from '@/hooks/use-rules.hook';

// Constants
import { RULE_TEMPLATES } from './rule-templates.constants';
import { NONE } from './rules.constants';

const TYPE_COLORS: Record<string, string> = {
  Testing: 'border-l-yellow-400',
  General: 'border-l-gray-400',
  Backend: 'border-l-blue-500',
  Frontend: 'border-l-green-500',
};

interface RuleTemplatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RuleTemplatesDialog({ open, onOpenChange }: RuleTemplatesDialogProps) {
  const { data: projects = [] } = useProjects();
  const createRule = useCreateRule();
  const [projectId, setProjectId] = useState<string>(NONE);
  const [added, setAdded] = useState<Set<string>>(new Set());

  const handleAdd = (templateName: string) => {
    const template = RULE_TEMPLATES.find((t) => t.name === templateName);
    if (!template) return;

    createRule.mutate(
      {
        name: template.name,
        type: template.type,
        tags: template.tags,
        content: template.content,
        projectId: projectId === NONE ? null : projectId,
      },
      {
        onSuccess: () => {
          setAdded((prev) => new Set(prev).add(templateName));
        },
      },
    );
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      setAdded(new Set());
      setProjectId(NONE);
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Rule Templates
          </DialogTitle>
          <DialogDescription>
            Add starter rules inspired by Superpowers. Each rule can be customised after adding.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
          <span className="text-sm text-muted-foreground">Scope:</span>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger className="h-7 w-auto min-w-[160px] border-0 bg-transparent text-sm shadow-none">
              <SelectValue placeholder="Select scope" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Global (all projects)</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {RULE_TEMPLATES.map((template) => {
            const isAdded = added.has(template.name);
            const borderColor = TYPE_COLORS[template.type] ?? 'border-l-gray-300';

            return (
              <div
                key={template.name}
                className={`flex flex-col gap-2 rounded-md border border-l-[3px] p-3 ${borderColor}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{template.name}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Badge variant="secondary" className="text-[10px]">
                        {template.type}
                      </Badge>
                      {template.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-[10px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={isAdded ? 'outline' : 'default'}
                    className="h-7 shrink-0 px-2.5 text-xs"
                    onClick={() => handleAdd(template.name)}
                    disabled={isAdded || createRule.isPending}
                  >
                    {isAdded ? (
                      <>
                        <Check className="mr-1 h-3 w-3" />
                        Added
                      </>
                    ) : (
                      'Add'
                    )}
                  </Button>
                </div>
                <p className="line-clamp-3 text-xs text-muted-foreground">{template.content}</p>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-1">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
