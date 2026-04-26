// React / library
import { ChevronDown, ChevronRight, Copy, Check, ArrowDownToLine } from 'lucide-react';
import { useEffect, useRef, useCallback, useState, useMemo, type ReactElement } from 'react';

// Shared
import { stripCliPromptEchoStreaming } from '@atlas/shared';

// Components
import { Button } from '@/components/ui/button';
import { NarrativeBlock } from './NarrativeBlock';
import { WorkspaceToolCallCard } from './WorkspaceToolCallCard';

// Lib
import { parseAgentOutput, stripAnsi } from '../lib/output-parser';

// Types
import type { AgentOutputProps } from '../workspaces.types';

export function AgentOutput({
  text,
  isLive,
  title = 'Agent Output',
  defaultCollapsed = false,
}: AgentOutputProps): ReactElement {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [rawMode, setRawMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const blocks = useMemo(() => parseAgentOutput(text), [text]);

  const lastToolCallIndex = useMemo(() => {
    for (let i = blocks.length - 1; i >= 0; i--) {
      if (blocks[i].type === 'tool_call') return i;
    }
    return -1;
  }, [blocks]);

  useEffect(() => {
    if (isLive && !collapsed) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [text, isLive, collapsed]);

  const handleCopy = useCallback(() => {
    const cleaned = stripAnsi(stripCliPromptEchoStreaming(text));
    navigator.clipboard.writeText(cleaned).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  const handleScrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-muted">
      <div
        className="flex items-center justify-between border-b border-border bg-muted/80 px-4 py-2 backdrop-blur-sm cursor-pointer select-none"
        onClick={() => setCollapsed((prev) => !prev)}
      >
        <div className="flex items-center gap-3">
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
          </div>
          <span className="text-xs font-medium text-muted-foreground">{title}</span>
          {isLive && (
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" />
              </span>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Live</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant={rawMode ? 'secondary' : 'ghost'}
            size="sm"
            className="h-6 text-xs px-2"
            onClick={() => setRawMode((v) => !v)}
          >
            Raw
          </Button>
          {isLive && !collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleScrollToBottom}
              title="Scroll to bottom"
            >
              <ArrowDownToLine className="h-3 w-3" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy} title="Copy output">
            {copied ? (
              <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>

      {!collapsed &&
        (rawMode ? (
          <pre className="max-h-[600px] overflow-auto px-4 py-3 text-xs font-mono text-foreground/80 whitespace-pre-wrap wrap-break-word leading-relaxed">
            {stripAnsi(stripCliPromptEchoStreaming(text))}
          </pre>
        ) : (
          <div ref={scrollContainerRef} className="max-h-[600px] overflow-y-auto px-4 py-3 space-y-2">
            {blocks.map((block, i) => {
              if (block.type === 'narrative') {
                return <NarrativeBlock key={i} content={block.content} />;
              }
              return (
                <WorkspaceToolCallCard
                  key={i}
                  tool={block.tool}
                  args={block.args}
                  isRunning={!!isLive && i === lastToolCallIndex}
                />
              );
            })}
            <div ref={bottomRef} />
          </div>
        ))}
    </div>
  );
}
