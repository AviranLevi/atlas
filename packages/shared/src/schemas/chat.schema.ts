import { z } from 'zod';

export const ChatBackendTypeEnum = z.enum(['api', 'cli']);

// ---------------------------------------------------------------------------
// Attachments
// ---------------------------------------------------------------------------

export const ATTACHMENT_MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const ATTACHMENT_MAX_COUNT = 5;

export const ATTACHMENT_ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
  'text/typescript',
  'application/typescript',
  'text/javascript',
  'application/javascript',
  'text/x-python',
] as const;

export const ChatAttachmentSchema = z.object({
  name: z.string(),
  mimeType: z
    .string()
    .refine((v) => ATTACHMENT_ALLOWED_MIME_TYPES.includes(v as (typeof ATTACHMENT_ALLOWED_MIME_TYPES)[number]), {
      message: 'Unsupported file type',
    }),
  size: z.number().int().positive().max(ATTACHMENT_MAX_SIZE_BYTES),
  data: z.string(), // base64-encoded file content
});
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
  attachments: z.array(ChatAttachmentSchema).nullable(),
  createdAt: z.string().datetime(),
});

export const CreateConversationSchema = z.object({
  projectId: z.string().uuid().nullable().optional(),
  backendType: ChatBackendTypeEnum.default('api'),
  providerId: z.string().uuid().nullable().optional(),
  executorId: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
});

export const SendMessageSchema = z
  .object({
    // content may be empty when attachments are present
    content: z.string(),
    attachments: z.array(ChatAttachmentSchema).max(ATTACHMENT_MAX_COUNT).optional(),
    mentionedAgentId: z.string().uuid().nullable().optional(),
  })
  .refine((data) => data.content.trim().length > 0 || (data.attachments?.length ?? 0) > 0, {
    message: 'Message must have content or at least one attachment',
  });

export type ChatBackendType = z.infer<typeof ChatBackendTypeEnum>;
export type ChatMessageRole = z.infer<typeof ChatMessageRoleEnum>;
export type ChatToolCall = z.infer<typeof ChatToolCallSchema>;
export type ChatToolResult = z.infer<typeof ChatToolResultSchema>;
export type ChatAttachment = z.infer<typeof ChatAttachmentSchema>;
export type ChatConversation = z.infer<typeof ChatConversationSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type CreateConversation = z.infer<typeof CreateConversationSchema>;
export type SendMessage = z.infer<typeof SendMessageSchema>;
