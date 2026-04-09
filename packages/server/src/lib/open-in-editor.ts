// External
import { exec as execCb, spawn } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execCb);

/** Editors tried in priority order. */
const EDITORS = ['cursor', 'code', 'windsurf'] as const;

/**
 * Opens a path in the first available editor (Cursor → VS Code → Windsurf).
 * Returns the editor name that was used, or null if none were found.
 */
export async function openInEditor(targetPath: string): Promise<string | null> {
  for (const editor of EDITORS) {
    try {
      await exec(`command -v ${editor}`, { timeout: 2000 });
      // Detach so the process outlives the server request
      const child = spawn(editor, [targetPath], {
        detached: true,
        stdio: 'ignore',
      });
      child.unref();
      return editor;
    } catch {
      // Editor not found, try next
    }
  }
  return null;
}
