import type { ReassemblyConfig, ReassemblyStrategy, ResolvedStrategy } from '../types';
import { anchorStrategy } from './anchor.strategy';
import { directStrategy } from './direct.strategy';
import { overflowMergeStrategy } from './overflow-merge.strategy';
import { AMOUNT_PATTERN, DATE_PATTERN } from './patterns';

const OVERFLOW_COLUMN_KEYWORDS = [
  'opis operacji', 'opis', 'description', 'tytuł', 'title', 'szczegóły', 'details', 'treść',
];

const DEFAULT_SAMPLE_SIZE = 10;
const ANCHOR_THRESHOLD = 0.8;
const MIN_ROW_LENGTH_FOR_ANCHOR = 4;

const detectOverflowColumnIndex = (headers: readonly string[]): number | undefined =>
  headers.findIndex((h) => {
    const normalized = h.toLowerCase().replace(/^#/, '').trim();
    return OVERFLOW_COLUMN_KEYWORDS.some((kw) => normalized.includes(kw));
  }) === -1
    ? undefined
    : headers.findIndex((h) => {
        const normalized = h.toLowerCase().replace(/^#/, '').trim();
        return OVERFLOW_COLUMN_KEYWORDS.some((kw) => normalized.includes(kw));
      });

const hasOverflowRows = (
  dataRows: readonly (readonly string[])[],
  expectedColumnCount: number,
  sampleSize = DEFAULT_SAMPLE_SIZE,
): boolean =>
  dataRows.slice(0, sampleSize).some((row) => row.length > expectedColumnCount);

const hasAnchorPattern = (
  dataRows: readonly (readonly string[])[],
  sampleSize = DEFAULT_SAMPLE_SIZE,
): boolean => {
  const sample = dataRows.slice(0, sampleSize);
  if (sample.length === 0) return false;

  const scores = sample
    .filter((row) => row.length >= MIN_ROW_LENGTH_FOR_ANCHOR)
    .reduce(
      (acc, row) => {
        const hasDateStart = DATE_PATTERN.test((row[0] ?? '').trim());
        const hasAmountEnd = row
          .slice(Math.max(0, row.length - 3))
          .some((t) => AMOUNT_PATTERN.test(t.trim()));
        return {
          dateStart: acc.dateStart + (hasDateStart ? 1 : 0),
          amountEnd: acc.amountEnd + (hasAmountEnd ? 1 : 0),
        };
      },
      { dateStart: 0, amountEnd: 0 },
    );

  const threshold = sample.length * ANCHOR_THRESHOLD;
  return scores.dateStart >= threshold && scores.amountEnd >= threshold;
};

/**
 * Decision logic:
 * 1. Anchor pattern (dates start, amounts end) → Anchor
 * 2. No overflow rows → Direct
 * 3. Overflow + identifiable overflow column → OverflowMerge
 * 4. Otherwise → Direct (safe fallback)
 */
export const resolveStrategy = (
  headers: readonly string[],
  dataRows: readonly (readonly string[])[],
  separator: string,
): ResolvedStrategy => {
  const expectedColumnCount = headers.length;

  if (hasAnchorPattern(dataRows)) {
    return { strategy: anchorStrategy, config: { expectedColumnCount, separator } };
  }

  if (!hasOverflowRows(dataRows, expectedColumnCount)) {
    return { strategy: directStrategy, config: { expectedColumnCount, separator } };
  }

  const overflowColumnIndex = detectOverflowColumnIndex(headers);

  if (overflowColumnIndex === undefined) {
    return { strategy: directStrategy, config: { expectedColumnCount, separator } };
  }

  const fixedTailColumns = expectedColumnCount - overflowColumnIndex - 1;

  return {
    strategy: overflowMergeStrategy,
    config: { expectedColumnCount, separator, overflowColumnIndex, fixedTailColumns },
  };
};
