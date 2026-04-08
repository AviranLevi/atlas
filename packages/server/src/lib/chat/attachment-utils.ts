// External
import { PDFParse } from 'pdf-parse';

// Shared
import type { ChatAttachment } from '@atlas/shared';

/** Returns true if the attachment is an image. */
export function isImage(attachment: ChatAttachment): boolean {
  return attachment.mimeType.startsWith('image/');
}

/** Returns true if the attachment is a PDF. */
export function isPdf(attachment: ChatAttachment): boolean {
  return attachment.mimeType === 'application/pdf';
}

/** Returns true for all plain-text file types (non-image, non-PDF). */
export function isTextFile(attachment: ChatAttachment): boolean {
  return !isImage(attachment) && !isPdf(attachment);
}

/** Decodes the base64 attachment data to a Buffer. */
export function toBuffer(attachment: ChatAttachment): Buffer {
  return Buffer.from(attachment.data, 'base64');
}

/** Extracts the text content from a PDF attachment using pdf-parse. */
export async function extractPdfText(attachment: ChatAttachment): Promise<string> {
  const buffer = toBuffer(attachment);
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  return result.text;
}

/** Decodes a text-file attachment to its UTF-8 string content. */
export function decodeText(attachment: ChatAttachment): string {
  return Buffer.from(attachment.data, 'base64').toString('utf-8');
}

/**
 * Wraps file content in a labelled XML-style tag so the model understands
 * the source of the text (filename + type).
 */
export function wrapFileContent(name: string, content: string): string {
  return `<file name="${name}">\n${content}\n</file>`;
}
