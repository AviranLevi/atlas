import { useEffect, useRef, useState } from 'react';

type MermaidDiagramProps = {
  definition: string;
  id: string;
};

let mermaidPromise: Promise<typeof import('mermaid').default> | null = null;

function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, theme: 'dark', darkMode: true });
      return mermaid;
    });
  }
  return mermaidPromise;
}

export function MermaidDiagram({ definition, id }: MermaidDiagramProps) {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const renderIdRef = useRef(0);

  useEffect(() => {
    const currentRender = ++renderIdRef.current;
    setSvg('');
    setError(null);

    const uniqueId = `${id}-${currentRender}`;
    loadMermaid()
      .then((mermaid) => mermaid.render(uniqueId, definition))
      .then(({ svg: rendered }) => {
        if (currentRender === renderIdRef.current) {
          setSvg(rendered);
        }
      })
      .catch((e: unknown) => {
        if (currentRender === renderIdRef.current) {
          setError(e instanceof Error ? e.message : 'Failed to render diagram');
        }
      });
  }, [id, definition]);

  if (error) {
    return <p className="text-xs text-destructive font-mono whitespace-pre-wrap">{error}</p>;
  }

  if (!svg) {
    return (
      <div className="flex h-32 items-center justify-center">
        <p className="text-sm text-muted-foreground">Rendering diagram...</p>
      </div>
    );
  }

  return (
    <div
      className="overflow-auto"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: SVG output produced by mermaid from a controlled diagram definition; mermaid sanitizes user-facing labels.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
