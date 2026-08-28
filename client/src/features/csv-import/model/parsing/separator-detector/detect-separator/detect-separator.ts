import { LINE_SPLIT_PATTERN } from '#features/csv-import/model/parsing/shared/patterns/line-split.pattern';

import { CANDIDATES } from '#features/csv-import/model/parsing/separator-detector/constants/candidates';
import { DEFAULT_SEPARATOR } from '#features/csv-import/model/parsing/separator-detector/constants/default-separator';
import { MAX_SAMPLE_LINES } from '#features/csv-import/model/parsing/separator-detector/constants/max-sample-lines';
import { scoreSeparator } from '#features/csv-import/model/parsing/separator-detector/helpers/score-separator';

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
