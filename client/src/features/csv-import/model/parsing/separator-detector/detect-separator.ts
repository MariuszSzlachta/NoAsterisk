import { LINE_SPLIT_PATTERN } from '#features/csv-import/model/parsing/shared';

import { scoreSeparator } from './helpers/score-separator';

const CANDIDATES = [';', ',', '\t', '|'] as const;
const MAX_SAMPLE_LINES = 30;
const DEFAULT_SEPARATOR = ';';

/**
 * Detect CSV separator by statistical analysis.
 *
 * Combines streak-based (longest consecutive run of lines with same count)
 * and mode-based (most common non-zero count) scoring.
 */
export const detectSeparator = (text: string): string => {
  const lines = text
    .split(LINE_SPLIT_PATTERN)
    .filter((l) => l.trim().length > 0)
    .slice(0, MAX_SAMPLE_LINES);

  if (lines.length === 0) {
    return DEFAULT_SEPARATOR;
  }

  const scored = CANDIDATES.map((sep) => ({
    sep,
    score: scoreSeparator(lines, sep),
  }));

  const best = scored.reduce((a, b) => (b.score > a.score ? b : a));
  return best.score > 0 ? best.sep : DEFAULT_SEPARATOR;
};
