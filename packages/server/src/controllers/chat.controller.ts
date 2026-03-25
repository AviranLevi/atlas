// External
import type { Context } from 'hono';
import { streamSSE } from 'hono/streaming';

// Shared
import type { CreateConversation, SendMessage } from '@my-agents/shared';

// Services
import { chatService } from '../services/index.js';

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
  const data = (c.req as unknown as { valid(target: 'json'): CreateConversation }).valid('json');
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
  const data = (c.req as unknown as { valid(target: 'json'): SendMessage }).valid('json');

  return streamSSE(c, async (stream) => {
    await chatService.sendMessage(conversationId, data.content, async (event, payload) => {
      await stream.writeSSE({ event, data: JSON.stringify(payload) });
    });
  });
}

export async function abortStream(c: Context) {
  chatService.abortStream(c.req.param('id')!);
  return c.body(null, 204);
}
