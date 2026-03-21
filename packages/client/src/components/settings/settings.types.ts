export type ConnectionInfo = {
  sseUrl: string;
  messagesUrl: string;
  cursorConfig: Record<string, unknown>;
  claudeDesktopConfig: Record<string, unknown>;
  stdioConfig: Record<string, unknown>;
  instructions: Record<string, string>;
};
