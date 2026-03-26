// External
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

// Shared
import { CreateConversationSchema, SendMessageSchema } from '@atlas/shared';

// Controllers
import {
  listConversations,
  getConversation,
  createConversation,
  deleteConversation,
  getMessages,
  sendMessage,
  abortStream,
} from '../controllers/chat.controller.js';

export const chatRoute = new Hono()
  .get('/conversations', listConversations)
  .post('/conversations', zValidator('json', CreateConversationSchema), createConversation)
  .get('/conversations/:id', getConversation)
  .delete('/conversations/:id', deleteConversation)
  .get('/conversations/:id/messages', getMessages)
  .post('/conversations/:id/messages', zValidator('json', SendMessageSchema), sendMessage)
  .delete('/conversations/:id/stream', abortStream);
