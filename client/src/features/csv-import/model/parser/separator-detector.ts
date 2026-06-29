const CANDIDATES = [';', ',', '\t', '|'] as const;
const SAMPLE_LINES = 10;

/**
 * Detect CSV separator by statistical analysis of first N lines.
 * Strategy: the separator is the character with the most CONSISTENT count across lines.
 */
export const detectSeparator = (text: string): string => {
  const lines = text
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0)
    .slice(0, SAMPLE_LINES);
  if (lines.length === 0) {
    return ';';
  }

  let bestSep = ';';
  let bestScore = -1;

  for (const sep of CANDIDATES) {
    const counts = lines.map((line) => countUnquoted(line, sep));
    if (counts[0] === 0) {
      continue;
    }

    // Score = consistency (low variance) × frequency
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
    const variance =
      counts.reduce((s, c) => s + (c - avg) ** 2, 0) / counts.length;
    const consistency = avg > 0 ? 1 / (1 + variance) : 0;
    const score = avg * consistency;

    if (score > bestScore) {
      bestScore = score;
      bestSep = sep;
    }
  }

  return bestSep;
};

/**
 * Count occurrences of char in string, ignoring occurrences inside quoted fields.
 */
const countUnquoted = (line: string, char: string): number => {
  let count = 0;
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      inQuotes = !inQuotes;
    } else if (!inQuotes && line[i] === char) {
      count++;
    }
  }

  return count;
};
