import { resolveConflicts } from '#features/csv-import/model/anonymization/conflict-resolver/conflict.resolver';
import { applyMasking } from '#features/csv-import/model/anonymization/masker/apply-masking';
import type {
  AnonymizationStatus,
  DetectionSpan,
  DictionarySet,
  PiiDetector,
} from '#features/csv-import/model/anonymization/types';

import { buildPriorityMap } from './build-priority-map';
import { DEFAULT_DETECTORS } from './default-detectors';
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
