// React / library
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { Terminal } from '@xterm/xterm';
import { Copy, Check, ArrowDownToLine } from 'lucide-react';
import { useEffect, useRef, useCallback, useState, type ReactElement } from 'react';

// Components
import '@xterm/xterm/css/xterm.css';

// Components
import { Button } from '@/components/ui/button';

// Hooks
import { useTheme } from '@/hooks/use-theme.hook';

// Types
import type { TerminalOutputProps } from '../workspaces.types';

/** xterm theme aligned with neutral app tokens (approx. oklch light/dark surfaces). */
function buildTheme(dark: boolean) {
  return {
    background: dark ? '#0a0a0a' : '#fafafa',
    foreground: dark ? '#e5e5e5' : '#171717',
    cursor: 'transparent',
    cursorAccent: 'transparent',
    selectionBackground: dark ? '#262626' : '#e5e5e5',
    selectionForeground: undefined,
    black: dark ? '#050505' : '#fafafa',
    red: '#dc2626',
    green: '#16a34a',
    yellow: '#ca8a04',
    blue: '#2563eb',
    magenta: '#7c3aed',
    cyan: '#0891b2',
    white: dark ? '#f5f5f5' : '#0a0a0a',
    brightBlack: dark ? '#525252' : '#a3a3a3',
    brightRed: '#f87171',
    brightGreen: '#4ade80',
    brightYellow: '#facc15',
    brightBlue: '#60a5fa',
    brightMagenta: '#a78bfa',
    brightCyan: '#22d3ee',
    brightWhite: '#fafafa',
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
      fontFamily: "'Geist Mono Variable', ui-monospace, Menlo, Monaco, monospace",
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
  }, [isDark, text]);

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
    <div className="rounded-lg border border-border overflow-hidden bg-muted">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-border bg-muted/80 px-4 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-3">
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
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy} title="Copy output">
            {copied ? (
              <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>

      {/* Terminal body -- inner padding wrapper so FitAddon calculates columns from reduced width */}
      <div className="px-3 pt-3 pb-1">
        <div ref={wrapperRef} className="h-[500px] overflow-hidden [&_.xterm-viewport]:overflow-y-auto!" />
      </div>
    </div>
  );
}
