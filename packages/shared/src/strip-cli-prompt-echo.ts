const LEADING_SYSTEM = /^<system>[\s\S]*?<\/system>\s*/i;
const LEADING_HISTORY = /^<conversation_history>[\s\S]*?<\/conversation_history>\s*/i;
const LEADING_USER = /^<user>[\s\S]*?<\/user>\s*/i;
/**
 * Matches the "Respond to the user's latest message…" instruction appended by formatCliPrompt.
 * Some models output it at the very start of their reply (no leading newline) or in the middle,
 * so we match it at position 0 OR after a newline, and do NOT require end-of-string.
 */
const TRAILING_INSTRUCTION =
  /(?:^|\n)Respond to the user's latest message\.[\s\S]*?only your answer to the user\.\s*/i;

/**
 * Removes leading prompt-echo blocks (`<system>`, `<conversation_history>`, `<user>`) and
 * the trailing "Respond to the user's latest message" instruction that CLI one-shot prompts
 * inject. Some models parrot the full prompt back before (or instead of) answering.
 */
export function stripCliPromptEcho(text: string): string {
  // Strip trailing instruction first so it doesn't appear after block stripping
  let t = text.replace(TRAILING_INSTRUCTION, '').trimStart();
  let changed = true;
  while (changed) {
    changed = false;
    for (const pattern of [LEADING_SYSTEM, LEADING_HISTORY, LEADING_USER]) {
      const stripped = t.replace(pattern, '').trimStart();
      if (stripped !== t) {
        t = stripped;
        changed = true;
        break;
      }
    }
  }
  return t;
}

/**
 * Same as {@link stripCliPromptEcho}, but safe to call on a partial (still-streaming) buffer:
 * if a known echo block has started but its closing tag is not yet in the buffer, returns
 * empty string so partial tags are never shown to the user.
 */
export function stripCliPromptEchoStreaming(text: string): string {
  const t = text.trimStart();
  if (t.length === 0) return text;
  // Suppress output while we're still inside a prompt-echo block
  if (/^<system\b/i.test(t) && !/<\/system>/i.test(t)) return '';
  if (/^<conversation_history\b/i.test(t) && !/<\/conversation_history>/i.test(t)) return '';
  if (/^<user\b/i.test(t) && !/<\/user>/i.test(t)) return '';
  // Suppress output while the trailing instruction is still streaming (partial match at start)
  if (/^Respond to the user's latest message\b/i.test(t) && !/only your answer to the user\./i.test(t)) return '';
  return stripCliPromptEcho(text);
}
