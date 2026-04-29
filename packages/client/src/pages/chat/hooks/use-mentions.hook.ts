// React / library
import { useCallback, useState, type Dispatch, type RefObject, type SetStateAction } from 'react';

// Hooks
import { useAgents } from '@/hooks/use-agents.hook';

// Types
import type { Agent } from '@atlas/shared';

type MentionedAgent = { id: string; name: string };

/**
 * Manages @-mention state: query parsing, agent selection, and badge lifecycle.
 *
 * @param setValue  The ChatInput value setter — called internally so the hook can
 *                  inject the completed mention text without exposing value as a param.
 * @param textareaRef  Used to restore focus after a mention is selected from the popover.
 */
export function useMentions(
  setValue: Dispatch<SetStateAction<string>>,
  textareaRef: RefObject<HTMLTextAreaElement | null>,
) {
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionedAgent, setMentionedAgent] = useState<MentionedAgent | null>(null);

  const { data: agents = [] } = useAgents();

  /**
   * Drop-in replacement for a plain onChange handler.
   * Calls setValue AND parses the trailing @-query so the popover opens/closes.
   */
  const handleTextChange = useCallback(
    (newValue: string) => {
      setValue(newValue);

      const lastAtIndex = newValue.lastIndexOf('@');
      if (lastAtIndex !== -1) {
        const beforeAt = newValue[lastAtIndex - 1];
        // Only trigger if @ is at start or preceded by whitespace
        if (lastAtIndex === 0 || !beforeAt || /\s/.test(beforeAt)) {
          const afterAt = newValue.slice(lastAtIndex + 1);
          if (!afterAt.includes(' ') && !afterAt.includes('\n')) {
            setMentionQuery(afterAt);
            return;
          }
        }
      }
      setMentionQuery(null);
    },
    [setValue],
  );

  /**
   * Called when a user picks an agent from the popover.
   * Receives currentValue to avoid stale closure on the text state.
   */
  const handleMentionSelect = useCallback(
    (agent: MentionedAgent, currentValue: string) => {
      const lastAtIndex = currentValue.lastIndexOf('@');
      const newValue = currentValue.slice(0, lastAtIndex) + `@${agent.name} `;
      setValue(newValue);
      setMentionedAgent(agent);
      setMentionQuery(null);
      textareaRef.current?.focus();
    },
    [setValue, textareaRef],
  );

  const clearMention = useCallback(() => setMentionedAgent(null), []);
  const clearMentionQuery = useCallback(() => setMentionQuery(null), []);

  const filteredAgents: Agent[] =
    mentionQuery !== null ? agents.filter((a) => a.name.toLowerCase().includes(mentionQuery.toLowerCase())) : [];

  return {
    mentionQuery,
    mentionedAgent,
    filteredAgents,
    handleTextChange,
    handleMentionSelect,
    clearMention,
    clearMentionQuery,
  };
}
