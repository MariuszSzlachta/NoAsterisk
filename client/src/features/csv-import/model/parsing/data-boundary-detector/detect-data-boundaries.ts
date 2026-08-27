import type { DataBoundaries } from '#features/csv-import/model/parsing/types';

import { classifyHeader } from './helpers/classify-header';
import { fallbackKeywordDetection } from './helpers/fallback-keyword-detection';
import { findFirstDataRow } from './helpers/find-first-data-row';
import { walkBackToCandidate } from './helpers/walk-back-to-candidate';

/**
 * 3-Phase boundary detection:
 * 1. Find First Data Row — line with date in field[0..1]
 * 2. Walk back from FDR to find header candidate
 * 3. Classify candidate with keyword heuristic
 */
export const detectDataBoundaries = (
  text: string,
  separator: string,
): DataBoundaries => {
  const allLines = text.split(/\r?\n/);

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
  };
};
