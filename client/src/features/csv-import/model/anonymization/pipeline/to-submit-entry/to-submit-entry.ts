import type { AnonymizationEntry } from '#features/csv-import/model/anonymization/types/anonymization-entry';
import type { AnonymizationSubmitEntry } from '#features/csv-import/model/anonymization/types/anonymization-submit-entry';

export const toSubmitEntry = (
  entry: AnonymizationEntry,
): AnonymizationSubmitEntry => ({
  rowIndex: entry.rowIndex,
  anonymizedTitle: entry.anonymizedTitle,
  status: entry.status,
  accepted: entry.accepted,
});
