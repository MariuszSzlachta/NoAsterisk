import type {
  AnonymizationEntry,
  AnonymizationStatus,
  DetectionSpan,
  DictionarySet,
  PiiDetector,
} from '../types';
import { resolveConflicts } from './conflict-resolver';
import { addressDetector } from './detectors/address-detector';
import { cardDetector } from './detectors/card-detector';
import { emailDetector } from './detectors/email-detector';
import { ibanDetector } from './detectors/iban-detector';
import { nameDetector } from './detectors/name-detector';
import { phoneDetector } from './detectors/phone-detector';
import { applyMasking } from './masker';

// ─── Constants ───────────────────────────────────────────────────

const AUTO_ACCEPT_THRESHOLD = 0.9;
const REVIEW_THRESHOLD = 0.7;

// ─── Registry ────────────────────────────────────────────────────

const DETECTORS: readonly PiiDetector[] = [
  ibanDetector,
  cardDetector,
  phoneDetector,
  emailDetector,
  nameDetector,
  addressDetector,
];

const PRIORITY_MAP = new Map<string, number>(
  DETECTORS.map((d) => [d.id, d.priority]),
);

// ─── Whitelist Filter ────────────────────────────────────────────

/**
 * Architecture doc § 4 step 3: discard spans whose text matches known entities.
 */
const filterByWhitelist = (
  spans: readonly DetectionSpan[],
  dictionaries: DictionarySet,
): DetectionSpan[] =>
  spans.filter((span) => {
    const upper = span.original.toUpperCase();
    const lower = span.original.toLowerCase();

    if (dictionaries.merchants.has(upper)) {
      return false;
    }
    if (dictionaries.cities.has(upper)) {
      return false;
    }
    if (dictionaries.phrases.has(lower)) {
      return false;
    }

    // Multi-word merchant check
    const words = span.original.split(/\s+/);
    if (
      words.length <= 3 &&
      dictionaries.merchants.has(words.map((w) => w.toUpperCase()).join(' '))
    ) {
      return false;
    }

    return true;
  });

// ─── Confidence Gate ─────────────────────────────────────────────

/**
 * Architecture doc § 4 step 5: discard spans below review threshold.
 */
const applyConfidenceGate = (
  spans: readonly DetectionSpan[],
): DetectionSpan[] => spans.filter((s) => s.confidence >= REVIEW_THRESHOLD);

// ─── Pipeline ────────────────────────────────────────────────────

const determineStatus = (
  spans: readonly DetectionSpan[],
): AnonymizationStatus => {
  if (spans.length === 0) {
    return 'safe';
  }
  if (spans.every((s) => s.confidence >= AUTO_ACCEPT_THRESHOLD)) {
    return 'anonymized';
  }
  return 'needs_review';
};

/**
 * Run full anonymization pipeline on a single title.
 *
 * Pipeline steps (per architecture doc § 4):
 * 1. Run all detectors
 * 2. Whitelist filter (merchants/cities/phrases)
 * 3. Confidence gate (discard < 0.7)
 * 4. Conflict resolution (priority > confidence)
 * 5. Masking
 */
export const anonymizeTitle = (
  text: string,
  dictionaries: DictionarySet,
): { spans: DetectionSpan[]; masked: string; status: AnonymizationStatus } => {
  // 1. Run all detectors
  const allSpans = DETECTORS.flatMap((detector) =>
    detector.detect(text, dictionaries),
  );

  // 2. Whitelist filter
  const filtered = filterByWhitelist(allSpans, dictionaries);

  // 3. Confidence gate
  const gated = applyConfidenceGate(filtered);

  // 4. Resolve conflicts
  const resolved = resolveConflicts(gated, PRIORITY_MAP);

  // 5. Apply masking
  const masked = applyMasking(text, resolved);

  // 6. Determine status
  const status = determineStatus(resolved);

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
): AnonymizationEntry[] =>
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
