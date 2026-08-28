import { AMOUNT_PATTERN } from '#features/csv-import/model/parsing/strategies/constants/amount.pattern';
import { DATE_PATTERN } from '#features/csv-import/model/parsing/strategies/constants/date.pattern';

export const DEFAULT_SAMPLE_SIZE = 10;
export const ANCHOR_THRESHOLD = 0.8;
export const MIN_ROW_LENGTH_FOR_ANCHOR = 4;

export const hasAnchorPattern = (
  dataRows: readonly (readonly string[])[],
  sampleSize = DEFAULT_SAMPLE_SIZE,
): boolean => {
  const sample = dataRows.slice(0, sampleSize);
  if (sample.length === 0) {
    return false;
  }

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
