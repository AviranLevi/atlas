// React / library
import { Loader2, Sparkles } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';

// Types
import type { DocType } from '@atlas/shared';

// Constants
import { TYPE_CONFIG } from '../documents.constants';

type AiTypePromptProps = {
  type: DocType;
  onGenerate: () => void;
  isGenerating: boolean;
};

export function AiTypePrompt({ type, onGenerate, isGenerating }: AiTypePromptProps) {
  const cfg = TYPE_CONFIG[type];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{cfg.label}</h2>
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            This diagram hasn't been generated yet.
          </p>
          <Button onClick={onGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-1.5 h-4 w-4" />
            )}
            {isGenerating ? 'Generating...' : `Generate ${cfg.label}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
