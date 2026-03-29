// React / library
import { useEffect, useRef } from 'react';

interface LogLine {
  type: 'tool' | 'text';
  toolName?: string;
  toolHint?: string;
  content: string;
}

function parseLines(text: string): LogLine[] {
  return text
    .split('\n')
    .filter((l) => l.trim())
    .map((line) => {
      if (line.startsWith('▸ ')) {
        const rest = line.slice(2);
        const spaceIdx = rest.search(/\s{2,}|\t/);
        const toolName = spaceIdx > -1 ? rest.slice(0, spaceIdx) : rest;
        const toolHint = spaceIdx > -1 ? rest.slice(spaceIdx).trim() : '';
        return { type: 'tool', toolName, toolHint, content: line };
      }
      return { type: 'text', content: line };
    });
}

interface LogOutputProps {
  text: string;
}

export function LogOutput({ text }: LogOutputProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const userScrolledUp = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || userScrolledUp.current) return;
    el.scrollTop = el.scrollHeight;
  }, [text]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    userScrolledUp.current = el.scrollHeight - el.scrollTop - el.clientHeight > 40;
  };

  const lines = parseLines(text);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="max-h-[500px] overflow-auto p-4 space-y-1"
    >
      {lines.map((line, i) =>
        line.type === 'tool' ? (
          <div key={i} className="flex items-baseline gap-1.5 font-mono text-xs text-muted-foreground/70">
            <span className="shrink-0">▸</span>
            <span className="font-semibold text-muted-foreground">{line.toolName}</span>
            {line.toolHint && (
              <span className="truncate opacity-60">{line.toolHint}</span>
            )}
          </div>
        ) : (
          <p key={i} className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {line.content}
          </p>
        ),
      )}
      <div ref={bottomRef} />
    </div>
  );
}
