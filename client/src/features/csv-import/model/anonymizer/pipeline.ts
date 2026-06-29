import type { AnonymizationEntry, AnonymizationStatus, DetectionSpan, DictionarySet, PiiDetector, PiiType } from '../types';

import { ibanDetector } from './detectors/iban-detector';
import { phoneDetector } from './detectors/phone-detector';
import { emailDetector } from './detectors/email-detector';
import { nameDetector } from './detectors/name-detector';
import { addressDetector } from './detectors/address-detector';

// ─── Registry ────────────────────────────────────────────────────

const DETECTORS: readonly PiiDetector[] = [
  ibanDetector,
  phoneDetector,
  emailDetector,
  nameDetector,
  addressDetector,
];

// ─── Conflict Resolver ───────────────────────────────────────────

/**
 * Resolve overlapping spans: higher priority wins.
 * If same priority: higher confidence wins.
 */
const resolveConflicts = (spans: readonly DetectionSpan[]): DetectionSpan[] => {
  const sorted = [...spans].sort((a, b) => {
    const priDiff = b.confidence - a.confidence; // Higher confidence first
    return priDiff;
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

const MASK_STRATEGIES: Record<PiiType, (original: string) => string> = {
  iban: (s) => {
    const clean = s.replace(/\s/g, '');
    return `${clean.slice(0, 4)} •••• •••• ${clean.slice(-4)}`;
  },
  name: (s) => {
    const parts = s.split(/[\s-]+/);
    return parts.map((p) => `${p[0]}${'•'.repeat(Math.min(p.length - 1, 6))}`).join(' ');
  },
  phone: (s) => {
    const digits = s.replace(/\D/g, '');
    return `••• ••• ${digits.slice(-3)}`;
  },
  email: (s) => {
    const [local, domain] = s.split('@');
    return `${local[0]}•••@${domain}`;
  },
  address: (s) => {
    const prefix = s.match(/^(ul\.|al\.|os\.|pl\.)/i);
    return prefix ? `${prefix[0]} •••` : '••• •••';
  },
};

const maskSpan = (span: DetectionSpan): string =>
  MASK_STRATEGIES[span.type](span.original);

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
  if (spans.every((s) => s.confidence >= 0.9)) return 'anonymized';
  return 'needs_review';
};

/**
 * Run full anonymization pipeline on a single title.
 */
export const anonymizeTitle = (
  text: string,
  dictionaries: DictionarySet,
): { spans: DetectionSpan[]; masked: string; status: AnonymizationStatus } => {
  // 1. Run all detectors
  const allSpans = DETECTORS.flatMap((detector) => detector.detect(text, dictionaries));

  // 2. Resolve conflicts (overlapping spans)
  const resolved = resolveConflicts(allSpans);

  // 3. Apply masking
  const masked = applyMasking(text, resolved);

  // 4. Determine status
  const status = determineStatus(resolved);

  return { spans: resolved, masked, status };
};

/**
 * Process all rows through the anonymization pipeline.
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
