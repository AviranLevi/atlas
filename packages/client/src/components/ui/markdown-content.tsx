// React / library
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Lib
import { cn } from '@/lib/utils';

// Types
import type { MarkdownContentProps } from './ui.types';

/** Renders Markdown content with syntax-highlighted code blocks. */
export function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div className={cn('prose prose-sm prose-invert max-w-none break-words', className)}>
      <ReactMarkdown
        components={{
          code({ className: codeClassName, children, ...props }) {
            const match = /language-(\w+)/.exec(codeClassName || '');
            const codeString = String(children).replace(/\n$/, '');

            // Inline code (no language class, typically short)
            if (!match) {
              return (
                <code
                  className="rounded bg-background/70 px-1.5 py-0.5 text-xs font-mono text-foreground border border-border/50"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            // Fenced code block with language
            return (
              <SyntaxHighlighter
                style={oneDark}
                language={match[1]}
                PreTag="div"
                customStyle={{
                  margin: 0,
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                }}
              >
                {codeString}
              </SyntaxHighlighter>
            );
          },
          // Style overrides for common elements
          h1: ({ children }) => <h1 className="text-base font-bold mt-4 mb-2 first:mt-0">{children}</h1>,
          h2: ({ children }) => <h2 className="text-sm font-semibold mt-3 mb-1.5 first:mt-0">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-medium mt-2 mb-1 first:mt-0">{children}</h3>,
          p: ({ children }) => <p className="text-sm text-foreground leading-relaxed mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="text-sm text-foreground list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
          ol: ({ children }) => <ol className="text-sm text-foreground list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
          li: ({ children }) => <li className="text-sm leading-relaxed text-foreground">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-muted-foreground/30 pl-3 my-2 text-sm text-muted-foreground italic">
              {children}
            </blockquote>
          ),
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          a: ({ href, children }) => (
            <a href={href} className="text-primary underline underline-offset-2" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          hr: () => <hr className="border-border my-3" />,
          pre: ({ children }) => <div className="my-2">{children}</div>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
