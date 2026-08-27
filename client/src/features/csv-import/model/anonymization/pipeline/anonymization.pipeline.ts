import { resolveConflicts } from '#features/csv-import/model/anonymization/conflict-resolver/conflict.resolver';
import { applyMasking } from '#features/csv-import/model/anonymization/masker/pii.masker';
import type {
  AnonymizationEntry,
  AnonymizationStatus,
  AnonymizationSubmitEntry,
  DetectionSpan,
  DictionarySet,
  PiiDetector,
} from '#features/csv-import/model/anonymization/types';

import { buildPriorityMap, DEFAULT_DETECTORS } from './detector-registry';
import { applyConfidenceGate } from './steps/confidence-gate';
import { determineStatus } from './steps/determine-status';
import { normalizeWhitespace } from './steps/normalize-whitespace';
import { filterByWhitelist } from './steps/whitelist-filter';

/**
 * Run full anonymization pipeline on a single title.
 *
 * Pipeline steps (per architecture doc § 4):
 * 1. Run all detectors
 * 2. Whitelist filter (merchants/cities/phrases)
 * 3. Confidence gate (separate by threshold)
 * 4. Conflict resolution (priority > confidence)
 * 5. Masking + whitespace normalization
 * 6. Status determination
 */
export const anonymizeTitle = (
  text: string,
  dictionaries: DictionarySet,
  detectors: readonly PiiDetector[] = DEFAULT_DETECTORS,
): { spans: DetectionSpan[]; masked: string; status: AnonymizationStatus } => {
  const priorityMap = buildPriorityMap(detectors);

  const allSpans = detectors.flatMap((d) => d.detect(text, dictionaries));
  const filtered = filterByWhitelist(allSpans, dictionaries);
  const { accepted, belowThreshold } = applyConfidenceGate(filtered);
  const resolved = resolveConflicts(accepted, priorityMap);
  const masked = normalizeWhitespace(applyMasking(text, resolved));
  const status = determineStatus(resolved, belowThreshold.length > 0);

  return { spans: resolved, masked, status };
};

/**
 * Process all rows through the anonymization pipeline.
 *
 * ⚠️ Security: returned entries contain originalTitle for review UI only.
 * MUST be stripped before persisting in store or sending to backend.
 */
export const processRows = (
  titles: readonly string[],
  dictionaries: DictionarySet,
): readonly AnonymizationEntry[] =>
  titles.map((title, rowIndex) => {
    const { spans, masked, status } = anonymizeTitle(title, dictionaries);
    return {
      rowIndex,
      originalTitle: title,
      anonymizedTitle: masked,
      spans,
      status,
      accepted: status === 'safe' || status === 'anonymized',
    };
  });

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
