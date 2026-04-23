// React / library
import { Plus } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';

// Types
import type { DocType, ProjectDoc } from '@atlas/shared';

// Constants
import { AI_TYPES, TYPE_CONFIG } from '../documents.constants';

type DocsSidebarProps = {
  docs: ProjectDoc[];
  grouped: Record<string, ProjectDoc[]>;
  selectedDocId: string | null;
  selectedAiType: DocType | null;
  onSelectAiItem: (type: DocType) => void;
  onSelectDoc: (id: string) => void;
  onStartCreate: () => void;
  isAiItemActive: (type: DocType) => boolean;
};

export function DocsSidebar({
  docs,
  grouped,
  selectedDocId,
  selectedAiType,
  onSelectAiItem,
  onSelectDoc,
  onStartCreate,
  isAiItemActive,
}: DocsSidebarProps) {
  return (
    <div className="w-64 shrink-0 space-y-4">
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Auto-Generated</p>
        {AI_TYPES.map((type) => {
          const cfg = TYPE_CONFIG[type];
          const Icon = cfg.icon;
          const existing = docs.find((d) => d.type === type && d.source === 'ai');
          const active = isAiItemActive(type);
          return (
            <button
              key={type}
              type="button"
              onClick={() => onSelectAiItem(type)}
              className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                active ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="min-w-0 truncate">{cfg.label}</span>
              {!existing && <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">New</span>}
            </button>
          );
        })}
      </div>

      {grouped.Plans.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Plans</p>
          {grouped.Plans.map((doc) => {
            const Icon = TYPE_CONFIG.plan.icon;
            return (
              <button
                key={doc.id}
                type="button"
                onClick={() => onSelectDoc(doc.id)}
                className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                  selectedDocId === doc.id ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{doc.title}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Custom</p>
        {grouped.Custom.map((doc) => {
          const Icon = TYPE_CONFIG.custom.icon;
          return (
            <button
              key={doc.id}
              type="button"
              onClick={() => onSelectDoc(doc.id)}
              className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                selectedDocId === doc.id ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{doc.title}</span>
            </button>
          );
        })}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground"
          onClick={onStartCreate}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Doc
        </Button>
      </div>
    </div>
  );
}
