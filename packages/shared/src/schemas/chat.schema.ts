import { z } from "zod";

export const ChatMessageRoleEnum = z.enum(["user", "assistant", "tool"]);

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
  providerId: z.string().uuid(),
  model: z.string(),
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
  providerId: z.string().uuid(),
  model: z.string().min(1),
});

export const SendMessageSchema = z.object({
  content: z.string().min(1),
});

export type ChatMessageRole = z.infer<typeof ChatMessageRoleEnum>;
export type ChatToolCall = z.infer<typeof ChatToolCallSchema>;
export type ChatToolResult = z.infer<typeof ChatToolResultSchema>;
export type ChatConversation = z.infer<typeof ChatConversationSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type CreateConversation = z.infer<typeof CreateConversationSchema>;
export type SendMessage = z.infer<typeof SendMessageSchema>;
