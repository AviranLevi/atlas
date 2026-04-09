const LEADING_SYSTEM = /^<system>[\s\S]*?<\/system>\s*/i;
const LEADING_HISTORY = /^<conversation_history>[\s\S]*?<\/conversation_history>\s*/i;

/**
 * Removes leading `<system>` / `<conversation_history>` blocks that CLI one-shot
 * prompts inject; models sometimes parrot them into the reply.
 */
export function stripCliPromptEcho(text: string): string {
  let t = text.trimStart();
  let changed = true;
  while (changed) {
    changed = false;
    const withoutSystem = t.replace(LEADING_SYSTEM, '').trimStart();
    if (withoutSystem !== t) {
      t = withoutSystem;
      changed = true;
      continue;
    }
    const withoutHistory = t.replace(LEADING_HISTORY, '').trimStart();
    if (withoutHistory !== t) {
      t = withoutHistory;
      changed = true;
    }
  }
  return t;
}

/**
 * Same as {@link stripCliPromptEcho}, but while streaming: if a `<system>` echo has
 * started but `</system>` is not in the buffer yet, returns empty so partial tags are not shown.
 */
export function stripCliPromptEchoStreaming(text: string): string {
  const t = text.trimStart();
  if (t.length === 0) return text;
  if (/^<system\b/i.test(t) && !/<\/system>/i.test(text)) {
    return '';
  }
  return stripCliPromptEcho(text);
}
