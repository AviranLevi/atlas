// ─── Types ───────────────────────────────────────────────────────────

export type DiffViewMode = 'unified' | 'split';

export interface CommentingTarget {
  patchIndex: number;
  side: 'left' | 'right';
}

export interface ParsedLine {
  type: 'add' | 'remove' | 'context' | 'hunk' | 'meta';
  content: string;
  oldLineNum?: number;
  newLineNum?: number;
  patchIndex: number; // index in the raw patch array, used as comment key
}

export interface SplitRow {
  left?: ParsedLine;
  right?: ParsedLine;
}

// ─── Diff parser ─────────────────────────────────────────────────────

export function parsePatch(patch: string): ParsedLine[] {
  const rawLines = patch.split('\n');
  const result: ParsedLine[] = [];
  let oldLine = 0;
  let newLine = 0;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];

    if (line.startsWith('diff --git') || line.startsWith('index ') ||
        line.startsWith('---') || line.startsWith('+++')) {
      result.push({ type: 'meta', content: line, patchIndex: i });
      continue;
    }

    if (line.startsWith('@@')) {
      const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (match) {
        oldLine = parseInt(match[1], 10);
        newLine = parseInt(match[2], 10);
      }
      result.push({ type: 'hunk', content: line, patchIndex: i });
      continue;
    }

    if (line.startsWith('+')) {
      result.push({ type: 'add', content: line.slice(1), newLineNum: newLine, patchIndex: i });
      newLine++;
    } else if (line.startsWith('-')) {
      result.push({ type: 'remove', content: line.slice(1), oldLineNum: oldLine, patchIndex: i });
      oldLine++;
    } else if (line.startsWith(' ')) {
      result.push({ type: 'context', content: line.slice(1), oldLineNum: oldLine, newLineNum: newLine, patchIndex: i });
      oldLine++;
      newLine++;
    } else if (line === '') {
      // empty trailing line
    } else {
      result.push({ type: 'meta', content: line, patchIndex: i });
    }
  }

  return result;
}

/** Build side-by-side pairs for split view */
export function buildSplitRows(lines: ParsedLine[]): SplitRow[] {
  const rows: SplitRow[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.type === 'meta' || line.type === 'hunk') {
      rows.push({ left: line, right: line });
      i++;
      continue;
    }

    if (line.type === 'context') {
      rows.push({ left: line, right: line });
      i++;
      continue;
    }

    // Group consecutive removes followed by adds into pairs
    if (line.type === 'remove') {
      const removes: ParsedLine[] = [];
      while (i < lines.length && lines[i].type === 'remove') {
        removes.push(lines[i]);
        i++;
      }
      const adds: ParsedLine[] = [];
      while (i < lines.length && lines[i].type === 'add') {
        adds.push(lines[i]);
        i++;
      }

      const maxLen = Math.max(removes.length, adds.length);
      for (let j = 0; j < maxLen; j++) {
        rows.push({
          left: j < removes.length ? removes[j] : undefined,
          right: j < adds.length ? adds[j] : undefined,
        });
      }
      continue;
    }

    if (line.type === 'add') {
      rows.push({ left: undefined, right: line });
      i++;
      continue;
    }

    i++;
  }

  return rows;
}
