import { z } from 'zod';

/** Message type posted from a chat-UI iframe to the parent window. */
export const CHAT_UI_MESSAGE_TYPE = 'mcp-ui-action' as const;

/** All valid action types that a card can dispatch. */
export const CHAT_UI_ACTION_TYPES = ['prompt', 'execute', 'link', 'notify', 'intent', 'tool'] as const;
export type ChatUIActionType = (typeof CHAT_UI_ACTION_TYPES)[number];

export const ChatUIActionSchema = z.object({
  type: z.enum(CHAT_UI_ACTION_TYPES),
  payload: z.record(z.unknown()),
});
export type ChatUIAction = z.infer<typeof ChatUIActionSchema>;

export const ChatUIMessageSchema = z.object({
  type: z.literal(CHAT_UI_MESSAGE_TYPE),
  action: ChatUIActionSchema,
});
export type ChatUIMessage = z.infer<typeof ChatUIMessageSchema>;
