export type DiffChange = {
  type: 'eq' | 'add' | 'del';
  content: string;
};

/**
 * Computes a simple line-by-line diff between two strings.
 * Returns an array of changes.
 */
export function computeLineDiff(oldText: string, newText: string): DiffChange[] {
  const oldLines = oldText.split(/\r?\n/);
  const newLines = newText.split(/\r?\n/);
  
  // Basic algorithm: Longest Common Subsequence is ideal, but for simplicity/speed
  // in this context without external deps, we'll use a simplified approach 
  // optimized for "Append" and "Replace" scenarios common in course editing.
  
  const changes: DiffChange[] = [];
  let i = 0;
  let j = 0;

  while (i < oldLines.length || j < newLines.length) {
    if (i < oldLines.length && j < newLines.length && oldLines[i] === newLines[j]) {
      changes.push({ type: 'eq', content: oldLines[i] });
      i++;
      j++;
    } else if (j < newLines.length && (i >= oldLines.length || !oldLines.includes(newLines[j], i))) {
      // Line exists in new but not in remaining old (or is new insertion)
      changes.push({ type: 'add', content: newLines[j] });
      j++;
    } else if (i < oldLines.length) {
      // Line exists in old but not match in new (deletion)
      changes.push({ type: 'del', content: oldLines[i] });
      i++;
    } else {
      // Should not happen theoretically in this simplified loop, but safety break
      j++; 
      i++;
    }
  }

  return changes;
}

/**
 * Extracts structure summary (headings) from markdown content
 */
export function analyzeStructure(markdown: string): string[] {
  const lines = markdown.split(/\r?\n/);
  return lines
    .filter(line => line.trim().startsWith('#'))
    .map(line => line.trim());
}
