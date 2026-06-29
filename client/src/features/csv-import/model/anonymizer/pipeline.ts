import type { AnonymizationEntry, AnonymizationStatus, DetectionSpan, DictionarySet, PiiDetector } from '../types';

import { ibanDetector } from './detectors/iban-detector';
import { phoneDetector } from './detectors/phone-detector';
import { emailDetector } from './detectors/email-detector';
import { nameDetector } from './detectors/name-detector';
import { addressDetector } from './detectors/address-detector';

// ─── Constants ───────────────────────────────────────────────────

const AUTO_ACCEPT_THRESHOLD = 0.9;
const REVIEW_THRESHOLD = 0.7;

// ─── Registry ────────────────────────────────────────────────────

const DETECTORS: readonly PiiDetector[] = [
  ibanDetector,
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

    if (dictionaries.merchants.has(upper)) return false;
    if (dictionaries.cities.has(upper)) return false;
    if (dictionaries.phrases.has(lower)) return false;

    // Multi-word merchant check
    const words = span.original.split(/\s+/);
    if (words.length <= 3 && dictionaries.merchants.has(words.map((w) => w.toUpperCase()).join(' '))) return false;

    return true;
  });

// ─── Confidence Gate ─────────────────────────────────────────────

/**
 * Architecture doc § 4 step 5: discard spans below review threshold.
 */
const applyConfidenceGate = (spans: readonly DetectionSpan[]): DetectionSpan[] =>
  spans.filter((s) => s.confidence >= REVIEW_THRESHOLD);

// ─── Conflict Resolver ───────────────────────────────────────────

/**
 * Architecture doc § 4 step 4: higher priority wins, then higher confidence.
 */
const resolveConflicts = (spans: readonly DetectionSpan[]): DetectionSpan[] => {
  const sorted = [...spans].sort((a, b) => {
    const priA = PRIORITY_MAP.get(a.detectorId) ?? 0;
    const priB = PRIORITY_MAP.get(b.detectorId) ?? 0;
    const priDiff = priB - priA;
    if (priDiff !== 0) return priDiff;
    return b.confidence - a.confidence;
  });

  const resolved: DetectionSpan[] = [];
  for (const span of sorted) {
    const overlaps = resolved.some(
      (existing) => span.start < existing.end && span.end > existing.start,
    );
    if (!overlaps) {
      resolved.push(span);
    }
  }

  return resolved.sort((a, b) => a.start - b.start);
};

// ─── Masker ──────────────────────────────────────────────────────

type MaskFn = (original: string) => string;

const MASK_STRATEGIES: Record<string, MaskFn> = {
  iban: (s) => {
    const clean = s.replace(/\s/g, '');
    return `${clean.slice(0, 4)} •••• •••• ${clean.slice(-4)}`;
  },
  name: (s) => {
    const parts = s.split(/[\s-]+/).filter((p) => p.length > 0);
    return parts.map((p) => `${p[0]}${'•'.repeat(Math.min(p.length - 1, 6))}`).join(' ');
  },
  phone: (s) => {
    const digits = s.replace(/\D/g, '');
    return `••• ••• ${digits.slice(-3)}`;
  },
  email: (s) => {
    const atIdx = s.indexOf('@');
    if (atIdx <= 0) return '•••@•••';
    return `${s[0]}•••@${s.slice(atIdx + 1)}`;
  },
  address: (s) => {
    const prefix = s.match(/^(ul\.|al\.|os\.|pl\.)/i);
    return prefix ? `${prefix[0]} •••` : '••• •••';
  },
};

const maskSpan = (span: DetectionSpan): string =>
  (MASK_STRATEGIES[span.type] ?? ((o: string) => '•'.repeat(o.length)))(span.original);

const applyMasking = (text: string, spans: readonly DetectionSpan[]): string => {
  if (spans.length === 0) return text;

  let result = '';
  let lastEnd = 0;
  for (const span of spans) {
    result += text.slice(lastEnd, span.start) + maskSpan(span);
    lastEnd = span.end;
  }
  result += text.slice(lastEnd);
  return result;
};

// ─── Pipeline ────────────────────────────────────────────────────

const determineStatus = (spans: readonly DetectionSpan[]): AnonymizationStatus => {
  if (spans.length === 0) return 'safe';
  if (spans.every((s) => s.confidence >= AUTO_ACCEPT_THRESHOLD)) return 'anonymized';
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
  const allSpans = DETECTORS.flatMap((detector) => detector.detect(text, dictionaries));

  // 2. Whitelist filter
  const filtered = filterByWhitelist(allSpans, dictionaries);

  // 3. Confidence gate
  const gated = applyConfidenceGate(filtered);

  // 4. Resolve conflicts
  const resolved = resolveConflicts(gated);

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
