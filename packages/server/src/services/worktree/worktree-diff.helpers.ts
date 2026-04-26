/**
 * Parses raw `git diff` output (multiple files concatenated) into a map of
 * filename → per-file patch text. Each per-file patch keeps the original
 * `diff --git ...` header so it can be rendered standalone.
 */
export function parseDiffPatches(diffOutput: string): Map<string, string> {
  const patches = new Map<string, string>();
  if (!diffOutput) return patches;

  const fileSections = diffOutput.split(/^diff --git /m).slice(1);
  for (const section of fileSections) {
    const headerMatch = section.match(/^a\/(.+?) b\//);
    if (headerMatch) {
      patches.set(headerMatch[1], `diff --git ${section}`);
    }
  }
  return patches;
}

/** Lower-cased, hyphen-joined slug suitable for branch names. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}
