// Shared
import type { ChatConversation } from '@atlas/shared';

// Repositories
import { chatRepository } from '../../db/repositories/index.js';

/**
 * Sets a conversation's title from the first user message if it doesn't
 * already have one. Falls back to the first attachment name for
 * attachment-only messages, then to "New conversation".
 */
export function maybeGenerateTitle(conversation: ChatConversation): void {
  if (conversation.title) return;

  const messages = chatRepository.findMessagesByConversation(conversation.id);
  const firstUserMsg = messages.find((m) => m.role === 'user');
  if (!firstUserMsg) return;

  const rawTitle =
    firstUserMsg.content.trim() ||
    (firstUserMsg.attachments?.[0] ? `[${firstUserMsg.attachments[0].name}]` : 'New conversation');

  const title = rawTitle.slice(0, 50) + (rawTitle.length > 50 ? '...' : '');
  chatRepository.updateConversation(conversation.id, { title });
}
