// Shared
import { CHAT_UI_MESSAGE_TYPE } from '@atlas/shared';

// Lib
import { BASE_CSS } from './chat-ui.styles.js';

/** Inline script injected into every card — posts UIActions to the parent frame. */
export const POST_ACTION_SCRIPT = `
<script>
function sendAction(type, payload) {
  window.parent.postMessage({ type: ${JSON.stringify(CHAT_UI_MESSAGE_TYPE)}, action: { type, payload } }, '*');
}
</script>
`;

/** Wraps card body HTML in a self-contained page with the base stylesheet. */
export function htmlPage(body: string, extraCss = ''): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${BASE_CSS}${extraCss}</style></head><body>${body}</body></html>`;
}

/** Escapes text for safe HTML insertion. */
export function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
