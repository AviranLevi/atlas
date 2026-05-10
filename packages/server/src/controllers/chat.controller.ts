// External
import type { Context } from 'hono';
import { streamSSE } from 'hono/streaming';

// Shared
import type { CreateConversation, SendMessage, UpdateConversationMode } from '@atlas/shared';

// Services
import { chatService } from '../services/index.js';

// Lib
import { getValidatedBody } from '../lib/hono-helpers.js';

export async function listConversations(c: Context) {
  const projectId = c.req.query('projectId') || null;
  const conversations = await chatService.listConversations(projectId);
  return c.json(conversations);
}

export async function getConversation(c: Context) {
  const conversation = await chatService.getConversation(c.req.param('id')!);
  return c.json(conversation);
}

export async function createConversation(c: Context) {
  const data = getValidatedBody<CreateConversation>(c);
  const conversation = await chatService.createConversation(data);
  return c.json(conversation, 201);
}

export async function deleteConversation(c: Context) {
  await chatService.deleteConversation(c.req.param('id')!);
  return c.body(null, 204);
}

export async function getMessages(c: Context) {
  const messages = await chatService.getMessages(c.req.param('id')!);
  return c.json(messages);
}

export async function sendMessage(c: Context) {
  const conversationId = c.req.param('id')!;
  const data = getValidatedBody<SendMessage>(c);

  return streamSSE(c, async (stream) => {
    // When the client disconnects (navigation, tab close, explicit abort),
    // propagate the cancellation to the server-side stream so the CLI process is stopped
    // and a cancellation placeholder is saved, preventing infinite "waiting" state.
    stream.onAbort(() => chatService.abortStream(conversationId));

    await chatService.sendMessage(
      conversationId,
      data.content,
      async (event, payload) => {
        await stream.writeSSE({ event, data: JSON.stringify(payload) });
      },
      data.attachments,
      data.mentionedAgentId,
    );
  });
}

export async function abortStream(c: Context) {
  chatService.abortStream(c.req.param('id')!);
  return c.body(null, 204);
}

/** Updates the execution mode override for a conversation. */
export async function updateConversationMode(c: Context) {
  const data = getValidatedBody<UpdateConversationMode>(c);
  const conversation = await chatService.updateConversationMode(c.req.param('id')!, data.executionMode);
  return c.json(conversation);
}
