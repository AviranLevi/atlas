// Types
import type { ChatAttachment } from '@atlas/shared';
import type { AttachedFile } from '@/pages/chat/chat.types';

/** Reads a File as a base64 string (data without the `data:<mime>;base64,` prefix). */
export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the "data:<mime>;base64," prefix — the API only wants the raw base64
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Converts a staged AttachedFile to a ChatAttachment ready to send to the API. */
export async function toApiAttachment(af: AttachedFile): Promise<ChatAttachment> {
  const data = await readFileAsBase64(af.file);
  return {
    name: af.name,
    mimeType: af.mimeType,
    size: af.size,
    data,
  };
}

/** Triggers a browser download of a JSON object as a .json file. */
export function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
