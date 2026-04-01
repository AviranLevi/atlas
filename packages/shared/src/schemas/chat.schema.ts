import { z } from 'zod';

export const ChatBackendTypeEnum = z.enum(['api', 'cli']);
export const ChatMessageRoleEnum = z.enum(['user', 'assistant', 'tool']);

export const ChatToolCallSchema = z.object({
  id: z.string(),
  name: z.string(),
  args: z.record(z.unknown()),
});

export const ChatToolResultSchema = z.object({
  toolCallId: z.string(),
  result: z.unknown(),
});

export const ChatConversationSchema = z.object({
  id: z.string().uuid(),
  title: z.string().nullable(),
  projectId: z.string().uuid().nullable(),
  backendType: ChatBackendTypeEnum,
  providerId: z.string().uuid().nullable(),
  executorId: z.string().nullable(),
  model: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ChatMessageSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  role: ChatMessageRoleEnum,
  content: z.string(),
  toolCalls: z.array(ChatToolCallSchema).nullable(),
  toolResults: z.array(ChatToolResultSchema).nullable(),
  createdAt: z.string().datetime(),
});

export const CreateConversationSchema = z.object({
  projectId: z.string().uuid().nullable().optional(),
  backendType: ChatBackendTypeEnum.default('api'),
  providerId: z.string().uuid().nullable().optional(),
  executorId: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
});

export const SendMessageSchema = z.object({
  content: z.string().min(1),
});

export type ChatBackendType = z.infer<typeof ChatBackendTypeEnum>;
export type ChatMessageRole = z.infer<typeof ChatMessageRoleEnum>;
export type ChatToolCall = z.infer<typeof ChatToolCallSchema>;
export type ChatToolResult = z.infer<typeof ChatToolResultSchema>;
export type ChatConversation = z.infer<typeof ChatConversationSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type CreateConversation = z.infer<typeof CreateConversationSchema>;
export type SendMessage = z.infer<typeof SendMessageSchema>;
