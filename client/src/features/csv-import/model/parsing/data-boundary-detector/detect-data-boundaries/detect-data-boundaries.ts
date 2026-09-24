import { classifyHeader } from '#features/csv-import/model/parsing/data-boundary-detector/helpers/classify-header';
import { fallbackKeywordDetection } from '#features/csv-import/model/parsing/data-boundary-detector/helpers/fallback-keyword-detection';
import { findFirstDataRow } from '#features/csv-import/model/parsing/data-boundary-detector/helpers/find-first-data-row';
import { walkBackToCandidate } from '#features/csv-import/model/parsing/data-boundary-detector/helpers/walk-back-to-candidate';
import { LINE_SPLIT_PATTERN } from '#features/csv-import/model/parsing/shared/patterns/line-split.pattern';
import type { DataBoundaries } from '#features/csv-import/model/parsing/types/data-boundaries';

export const detectDataBoundaries = (
  text: string,
  separator: string,
): DataBoundaries => {
  const allLines = text.split(LINE_SPLIT_PATTERN);

  const firstDataRow = findFirstDataRow(allLines, separator);
  if (firstDataRow === -1) {
    return fallbackKeywordDetection(allLines, separator);
  }

  const headerCandidate = walkBackToCandidate(allLines, firstDataRow);
  const headerRow = classifyHeader(allLines, headerCandidate, separator);

  const startLine = headerRow ?? firstDataRow;
  const dataText = allLines.slice(startLine).join('\n');

  return {
    headerRow,
    dataStartRow: firstDataRow,
    skipRows: startLine,
    dataText,
    hasDateAnchoredRows: true,
  };
};
