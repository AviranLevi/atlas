// React / library
import { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronUp, Plug } from 'lucide-react';

// Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Hooks
import { useMcpConnectionInfo } from '@/hooks/use-settings.hook';

function CopyBlock({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2 text-xs" onClick={handleCopy}>
          {copied ? (
            <>
              <Check className="h-3 w-3 text-green-500" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
          )}
        </Button>
      </div>
      <pre className="rounded-md bg-muted px-3 py-2 text-xs overflow-x-auto whitespace-pre-wrap break-all font-mono">
        {value}
      </pre>
    </div>
  );
}

function CollapsibleSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-md border">
      <button
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors"
        onClick={() => setOpen((o) => !o)}
        type="button"
      >
        {title}
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="border-t px-4 py-3 space-y-3">{children}</div>}
    </div>
  );
}

export function McpConnectionPanel() {
  const { data: info, isLoading } = useMcpConnectionInfo();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="h-5 w-5" />
            MCP Connection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (!info) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plug className="h-5 w-5" />
          MCP Connection
        </CardTitle>
        <CardDescription>
          Connect Cursor, Claude, or any MCP-compatible tool to this platform
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <CopyBlock label="SSE Endpoint" value={info.sseUrl} />

        <CollapsibleSection title="Cursor — ~/.cursor/mcp.json">
          <p className="text-xs text-muted-foreground">
            {info.instructions.cursor}
          </p>
          <CopyBlock
            label="Cursor Config"
            value={JSON.stringify(info.cursorConfig, null, 2)}
          />
        </CollapsibleSection>

        <CollapsibleSection title="Claude Desktop — config.json">
          <p className="text-xs text-muted-foreground">
            {info.instructions.claude}
          </p>
          <CopyBlock
            label="Claude Desktop Config"
            value={JSON.stringify(info.claudeDesktopConfig, null, 2)}
          />
        </CollapsibleSection>

        <CollapsibleSection title="Claude Code CLI (stdio)">
          <p className="text-xs text-muted-foreground">
            {info.instructions.stdio}
          </p>
          <CopyBlock
            label="Stdio Config"
            value={JSON.stringify(info.stdioConfig, null, 2)}
          />
        </CollapsibleSection>
      </CardContent>
    </Card>
  );
}
