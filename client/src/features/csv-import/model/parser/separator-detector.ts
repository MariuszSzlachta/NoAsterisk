const CANDIDATES = [';', ',', '\t', '|'] as const;
const MAX_SAMPLE_LINES = 30;

/**
 * Detect CSV separator by statistical analysis.
 *
 * Strategy combines two approaches:
 * 1. Streak-based: find longest consecutive run of lines with same separator count
 *    (handles metadata headers/footers where separator is absent)
 * 2. Mode-based: find the most common non-zero count across all lines
 *    (handles files with occasional broken quoting that varies count by ±1-2)
 *
 * The candidate with the best combined score wins.
 */
export const detectSeparator = (text: string): string => {
  const lines = text
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0)
    .slice(0, MAX_SAMPLE_LINES);

  if (lines.length === 0) {
    return ';';
  }

  let bestSep = ';';
  let bestScore = -1;

  for (const sep of CANDIDATES) {
    const counts = lines.map((line) => countUnquoted(line, sep));
    const nonZeroCounts = counts.filter((c) => c > 0);

    if (nonZeroCounts.length === 0) {
      continue;
    }

    // Mode: most common non-zero count
    const freq = new Map<number, number>();
    for (const c of nonZeroCounts) {
      freq.set(c, (freq.get(c) ?? 0) + 1);
    }
    let modeCount = 0;
    let modeFreq = 0;
    for (const [count, frequency] of freq.entries()) {
      if (frequency > modeFreq || (frequency === modeFreq && count > modeCount)) {
        modeCount = count;
        modeFreq = frequency;
      }
    }

    // Streak: longest consecutive run of lines with the mode count (±1 tolerance)
    let maxStreak = 0;
    let currentStreak = 0;
    for (const count of counts) {
      if (count >= modeCount - 1 && count > 0) {
        currentStreak++;
        if (currentStreak > maxStreak) {
          maxStreak = currentStreak;
        }
      } else {
        currentStreak = 0;
      }
    }

    // Score: lines matching mode × average count × streak bonus
    const matchRatio = modeFreq / lines.length;
    const streakBonus = maxStreak / lines.length;
    const score = modeCount * (matchRatio + streakBonus);

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
