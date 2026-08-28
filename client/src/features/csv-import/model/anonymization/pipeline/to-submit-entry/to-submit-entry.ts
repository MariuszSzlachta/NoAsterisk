import type {
  AnonymizationEntry,
  AnonymizationSubmitEntry,
} from '#features/csv-import/model/anonymization/types';

/**
 * Strip raw PII from entry before persistence/submission.
 * MUST be used before any entry leaves the browser.
 */
export const toSubmitEntry = (
  entry: AnonymizationEntry,
): AnonymizationSubmitEntry => ({
  rowIndex: entry.rowIndex,
  anonymizedTitle: entry.anonymizedTitle,
  status: entry.status,
  accepted: entry.accepted,
});
