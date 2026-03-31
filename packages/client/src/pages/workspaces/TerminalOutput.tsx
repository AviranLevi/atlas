// React / library
import { useEffect, useRef, useCallback, useState, type ReactElement } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { Copy, Check, ArrowDownToLine } from 'lucide-react';
import '@xterm/xterm/css/xterm.css';

// Components
import { Button } from '@/components/ui/button';

// Hooks
import { useTheme } from '@/hooks/use-theme.hook';

// Types
import type { TerminalOutputProps } from './workspaces-page.types';

// Lib
import { cn } from '@/lib/utils';

function buildTheme(dark: boolean) {
  return {
    background: dark ? '#0c0c0e' : '#fafafa',
    foreground: dark ? '#d4d4d8' : '#27272a',
    cursor: 'transparent',
    cursorAccent: 'transparent',
    selectionBackground: dark ? '#3f3f46' : '#d4d4d8',
    selectionForeground: undefined,
    black: dark ? '#09090b' : '#fafafa',
    red: '#ef4444',
    green: '#22c55e',
    yellow: '#eab308',
    blue: '#3b82f6',
    magenta: '#a855f7',
    cyan: '#06b6d4',
    white: dark ? '#fafafa' : '#09090b',
    brightBlack: dark ? '#52525b' : '#a1a1aa',
    brightRed: '#f87171',
    brightGreen: '#4ade80',
    brightYellow: '#facc15',
    brightBlue: '#60a5fa',
    brightMagenta: '#c084fc',
    brightCyan: '#22d3ee',
    brightWhite: '#ffffff',
  };
}

export function TerminalOutput({ text, isLive, title = 'Agent Output' }: TerminalOutputProps): ReactElement {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const prevLengthRef = useRef(0);
  const { resolvedTheme } = useTheme();
  const [copied, setCopied] = useState(false);

  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    if (!wrapperRef.current) return;

    const term = new Terminal({
      disableStdin: true,
      convertEol: true,
      scrollback: 10000,
      fontSize: 13,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, Monaco, 'Courier New', monospace",
      lineHeight: 1.5,
      letterSpacing: 0,
      cursorBlink: false,
      cursorStyle: 'bar',
      cursorInactiveStyle: 'none',
      theme: buildTheme(isDark),
      smoothScrollDuration: 100,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());

    term.open(wrapperRef.current);

    // Double-rAF to let layout settle before calculating columns
    requestAnimationFrame(() => {
      fitAddon.fit();
      requestAnimationFrame(() => fitAddon.fit());
    });

    termRef.current = term;
    fitRef.current = fitAddon;
    prevLengthRef.current = 0;

    if (text) {
      term.write(text);
      prevLengthRef.current = text.length;
    }

    const observer = new ResizeObserver(() => {
      requestAnimationFrame(() => fitAddon.fit());
    });
    observer.observe(wrapperRef.current);

    return () => {
      observer.disconnect();
      term.dispose();
      termRef.current = null;
      fitRef.current = null;
      prevLengthRef.current = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const term = termRef.current;
    if (!term) return;
    const newContent = text.slice(prevLengthRef.current);
    if (newContent) {
      term.write(newContent);
      prevLengthRef.current = text.length;
    }
  }, [text]);

  useEffect(() => {
    const term = termRef.current;
    if (!term) return;
    term.options.theme = buildTheme(resolvedTheme === 'dark');
  }, [resolvedTheme]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  const handleScrollToBottom = useCallback(() => {
    termRef.current?.scrollToBottom();
  }, []);

  return (
    <div className={cn(
      'rounded-lg border overflow-hidden',
      isDark ? 'border-zinc-800 bg-[#0c0c0e]' : 'border-zinc-200 bg-[#fafafa]',
    )}>
      {/* Header bar */}
      <div className={cn(
        'flex items-center justify-between px-4 py-2 border-b',
        isDark
          ? 'bg-zinc-900/80 border-zinc-800'
          : 'bg-zinc-100 border-zinc-200',
      )}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
          </div>
          <span className={cn(
            'text-xs font-medium',
            isDark ? 'text-zinc-400' : 'text-zinc-500',
          )}>
            {title}
          </span>
          {isLive && (
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs text-emerald-500 font-medium">Live</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isLive && (
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
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleCopy}
            title="Copy output"
          >
            {copied
              ? <Check className="h-3 w-3 text-emerald-500" />
              : <Copy className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      {/* Terminal body -- inner padding wrapper so FitAddon calculates columns from reduced width */}
      <div className="px-3 pt-3 pb-1">
        <div
          ref={wrapperRef}
          className="h-[500px] overflow-hidden [&_.xterm-viewport]:overflow-y-auto!"
        />
      </div>
    </div>
  );
}
