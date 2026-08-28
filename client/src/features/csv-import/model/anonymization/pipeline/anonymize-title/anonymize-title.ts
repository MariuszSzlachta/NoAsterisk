import { resolveConflicts } from '#features/csv-import/model/anonymization/conflict-resolver';
import { applyMasking } from '#features/csv-import/model/anonymization/masker/apply-masking';
import type { AnonymizationStatus } from '#features/csv-import/model/anonymization/types/anonymization-status';
import type { DetectionSpan } from '#features/csv-import/model/anonymization/types/detection-span';
import type { DictionarySet } from '#features/csv-import/model/anonymization/types/dictionary-set';
import type { PiiDetector } from '#features/csv-import/model/anonymization/types/pii-detector';
import { buildPriorityMap } from '#features/csv-import/model/anonymization/pipeline/build-priority-map';
import { DEFAULT_DETECTORS } from '#features/csv-import/model/anonymization/pipeline/default-detectors';
import { applyConfidenceGate } from '#features/csv-import/model/anonymization/pipeline/steps/confidence-gate';
import { determineStatus } from '#features/csv-import/model/anonymization/pipeline/steps/determine-status';
import { normalizeWhitespace } from '#features/csv-import/model/anonymization/pipeline/steps/normalize-whitespace';
import { filterByWhitelist } from '#features/csv-import/model/anonymization/pipeline/steps/whitelist-filter';

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
