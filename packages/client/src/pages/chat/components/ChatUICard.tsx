// React / library
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ChatUIMessageSchema } from '@atlas/shared';

// Types
import type { UIResourceItem } from '../chat.types';

interface ChatUICardProps {
  resource: UIResourceItem;
  /** Called when the user clicks a "prompt" action button in the card. */
  onPrompt?: (text: string) => void;
  /** Called when the user clicks an "execute" action (e.g. Create Tasks). Switches mode then sends prompt. */
  onExecute?: (text: string) => void;
}

/** Renders an MCP UI HTML card in a sandboxed iframe and routes UIActions to the chat. */
export function ChatUICard({ resource, onPrompt, onExecute }: ChatUICardProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      // Only handle messages from this specific iframe.
      if (!frameRef.current || e.source !== frameRef.current.contentWindow) return;

      const parsed = ChatUIMessageSchema.safeParse(e.data);
      if (!parsed.success) return;

      const { type, payload } = parsed.data.action;

      switch (type) {
        case 'prompt':
          onPrompt?.(payload.prompt as string);
          break;
        case 'execute':
          (onExecute ?? onPrompt)?.(payload.prompt as string);
          break;
        case 'link': {
          const url = payload.url as string;
          if (url.startsWith('http')) {
            window.open(url, '_blank', 'noopener,noreferrer');
          } else {
            navigate(url);
          }
          break;
        }
        case 'notify':
          toast(payload.message as string);
          break;
        case 'intent':
          // Atlas-specific intent routing — extend as needed.
          break;
        case 'tool':
          // Tool calls from cards are re-sent as prompt messages for simplicity.
          onPrompt?.(`Run ${payload.toolName as string}: ${JSON.stringify(payload.params)}`);
          break;
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onPrompt, onExecute, navigate]);

  return (
    <iframe
      ref={frameRef}
      title={`ui-card-${resource.toolCallId}`}
      srcDoc={resource.html}
      sandbox="allow-scripts allow-same-origin"
      className="w-full rounded-lg border border-border/50 bg-transparent"
      style={{ height: 80, maxHeight: 800 }}
      onLoad={(e) => {
        // Auto-resize iframe to fit content height.
        const frame = e.currentTarget;
        try {
          const body = frame.contentDocument?.body;
          if (body) {
            const height = body.scrollHeight;
            frame.style.height = `${Math.min(height + 4, 800)}px`;
          }
        } catch {
          // cross-origin fallback
        }
      }}
    />
  );
}
