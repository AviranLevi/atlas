// React / library
import { Bot, ChevronDown, FileJson, ScrollText, Zap } from 'lucide-react';
import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Components
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

// Constants
import { EXAMPLE_JSON } from './packages.constants';

type UploadStepProps = {
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  parseError: string | null;
  isPreviewing: boolean;
  previewError: Error | null;
};

function useIsDark(): boolean {
  return document.documentElement.classList.contains('dark');
}

export function UploadStep({ onFileSelect, parseError, isPreviewing, previewError }: UploadStepProps) {
  const [showExample, setShowExample] = useState(false);
  const isDark = useIsDark();

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-6">
        <FileJson className="h-8 w-8 text-muted-foreground" />
        <Label htmlFor="package-file" className="cursor-pointer text-sm font-medium text-primary hover:underline">
          Choose JSON file
        </Label>
        <input id="package-file" type="file" accept=".json,.atlas.json" className="hidden" onChange={onFileSelect} />
        <div className="flex items-center gap-1.5">
          <Badge variant="secondary" className="gap-1 text-[10px]">
            <Bot className="h-2.5 w-2.5" /> Agent
          </Badge>
          <Badge variant="secondary" className="gap-1 text-[10px]">
            <Zap className="h-2.5 w-2.5" /> Skills
          </Badge>
          <Badge variant="secondary" className="gap-1 text-[10px]">
            <ScrollText className="h-2.5 w-2.5" /> Rules
          </Badge>
        </div>
        <p className="text-center text-[11px] text-muted-foreground">
          A single package can bundle an agent with its skills and rules
        </p>
      </div>

      <button
        type="button"
        onClick={() => setShowExample((v) => !v)}
        className="flex w-full items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showExample ? 'rotate-180' : ''}`} />
        {showExample ? 'Hide' : 'Show'} format example
      </button>

      {showExample && (
        <div className="max-h-56 overflow-y-auto rounded-md border">
          <SyntaxHighlighter
            language="json"
            style={isDark ? oneDark : oneLight}
            customStyle={{ margin: 0, fontSize: '0.6875rem', lineHeight: '1.5', borderRadius: '0.375rem' }}
          >
            {EXAMPLE_JSON}
          </SyntaxHighlighter>
        </div>
      )}

      {parseError && <p className="text-sm text-destructive">{parseError}</p>}
      {isPreviewing && <p className="text-sm text-muted-foreground">Analyzing package...</p>}
      {previewError && <p className="text-sm text-destructive">{previewError.message}</p>}
    </div>
  );
}
