import { MAX_SCAN_LINES } from '#features/csv-import/model/parsing/data-boundary-detector/constants/max-scan-lines';
import { MIN_COLUMNS } from '#features/csv-import/model/parsing/data-boundary-detector/constants/min-columns';
import { countHeaderKeywordMatches } from '#features/csv-import/model/parsing/data-boundary-detector/helpers/count-header-keyword-matches';
import { splitRespectingQuotes } from '#features/csv-import/model/parsing/shared/split-respecting-quotes';
import type { DataBoundaries } from '#features/csv-import/model/parsing/types/data-boundaries';

export const fallbackKeywordDetection = (
  allLines: readonly string[],
  separator: string,
): DataBoundaries => {
  const scored = allLines
    .slice(0, MAX_SCAN_LINES)
    .map((line, index) => {
      const fields = splitRespectingQuotes(line, separator);
      if (line.trim().length === 0 || fields.length < MIN_COLUMNS) {
        return { index, score: -1 };
      }
      return { index, score: countHeaderKeywordMatches(line) };
    })
    .reduce((best, curr) => (curr.score > best.score ? curr : best), {
      index: 0,
      score: -1,
    });

  const dataLines = allLines.slice(scored.index);
  return {
    headerRow: scored.index,
    dataStartRow: scored.index + 1,
    skipRows: scored.index,
    dataText: dataLines.join('\n'),
    hasDateAnchoredRows: false,
  };
};
