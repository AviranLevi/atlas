// External
import { Hono } from 'hono';

// Shared
import {
  CreateConversationSchema,
  SendMessageSchema,
  UpdateConversationConfigSchema,
  UpdateConversationModeSchema,
} from '@atlas/shared';
import { zValidator } from '@hono/zod-validator';

// Controllers
import {
  abortStream,
  createConversation,
  deleteConversation,
  getConversation,
  getMessages,
  listConversations,
  sendMessage,
  updateConversationConfig,
  updateConversationMode,
} from '../controllers/chat.controller.js';

export const chatRoute = new Hono()
  .get('/conversations', listConversations)
  .post('/conversations', zValidator('json', CreateConversationSchema), createConversation)
  .get('/conversations/:id', getConversation)
  .delete('/conversations/:id', deleteConversation)
  .patch('/conversations/:id/mode', zValidator('json', UpdateConversationModeSchema), updateConversationMode)
  .patch('/conversations/:id/config', zValidator('json', UpdateConversationConfigSchema), updateConversationConfig)
  .get('/conversations/:id/messages', getMessages)
  .post('/conversations/:id/messages', zValidator('json', SendMessageSchema), sendMessage)
  .delete('/conversations/:id/stream', abortStream);
