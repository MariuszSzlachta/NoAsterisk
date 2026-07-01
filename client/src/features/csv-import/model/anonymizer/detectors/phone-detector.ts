import type { DetectionSpan, DictionarySet, PiiDetector } from '../../types';

// Polish mobile: +48 XXX XXX XXX or XXX XXX XXX or XXXXXXXXX (9 digits)
const PL_PHONE = /(?:\+48[\s-]?)?(\d{3})[\s-]?(\d{3})[\s-]?(\d{3})\b/g;
// International: +XX XXXXXXXXX (country code + 7-12 digits)
const INT_PHONE = /\+\d{1,3}[\s-]?\d{3,4}[\s-]?\d{3,4}[\s-]?\d{2,4}\b/g;
// No-space prefix: +48601234567 or (+48)601234567
const NO_SPACE_PREFIX = /(?:\(\+?\d{1,3}\)|\+\d{1,3})\d{7,12}\b/g;

// Context keywords that appear before/near phone numbers in bank titles
const PHONE_CONTEXT_KEYWORDS = [
  'tel',
  'tel.',
  'telefon',
  'mob',
  'mobile',
  'sms',
  'kontakt',
];

// Numbers that look like phones but aren't (invoice numbers, order IDs, etc.)
const isLikelyNotPhone = (text: string, start: number): boolean => {
  const prefix = text.slice(Math.max(0, start - 20), start).toLowerCase();
  // Invoice/order/reference patterns
  if (/(?:fv|faktura|nr|numer|zamówienie|id|ref)[/\s:-]*$/i.test(prefix)) {
    return true;
  }
  // BLK reference numbers (BLIK transaction IDs, e.g. "BLK25060700847291")
  if (/blk\d*$/i.test(prefix)) {
    return true;
  }
  // Insurance policy numbers ("NR POLISY", "nr polisy klienta")
  if (/(?:polis[ya]|polisy)\b/i.test(prefix)) {
    return true;
  }
  // REF/ patterns (bank reference codes, e.g. "REF/2025/06/000001")
  if (/ref[/\s:-]*$/i.test(prefix)) {
    return true;
  }
  // Authorization codes ("autoryzacja:", "auth:")
  if (/(?:autoryzacja|auth)[/\s:-]*$/i.test(prefix)) {
    return true;
  }
  // If preceded by letters directly (like store number: "BIEDRONKA1234")
  if (start > 0 && /[A-Za-z/]$/.test(text.slice(start - 1, start))) {
    return true;
  }
  return false;
};

const hasPhoneContext = (text: string, start: number): boolean => {
  const prefix = text.slice(Math.max(0, start - 20), start).toLowerCase();
  return PHONE_CONTEXT_KEYWORDS.some((kw) => prefix.includes(kw));
};

export const phoneDetector: PiiDetector = {
  id: 'phone',
  priority: 85,

  detect(text: string, _dictionaries: DictionarySet): readonly DetectionSpan[] {
    const spans: DetectionSpan[] = [];

    for (const pattern of [PL_PHONE, INT_PHONE, NO_SPACE_PREFIX]) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(text)) !== null) {
        const original = match[0];
        const start = match.index;

        if (isLikelyNotPhone(text, start)) {
          continue;
        }

        // Bare 9-digit without +48: validate PL mobile prefix (5xx, 6xx, 7xx, 8xx)
        const hasPlus = original.startsWith('+') || original.startsWith('(');
        if (!hasPlus) {
          const digits = original.replace(/\D/g, '');
          const firstDigit = digits[0];
          if (firstDigit === undefined) {
            continue;
          }
          if (
            firstDigit !== '5' &&
            firstDigit !== '6' &&
            firstDigit !== '7' &&
            firstDigit !== '8'
          ) {
            continue;
          }
        }

        // +48 prefix = high confidence, context keyword = high, bare 9 digits = medium
        const hasContext = hasPhoneContext(text, start);
        const confidence = hasPlus ? 0.95 : hasContext ? 0.9 : 0.75;

        spans.push({
          start,
          end: start + original.length,
          type: 'phone',
          confidence,
          original,
          detectorId: 'phone',
        });
      }
    }

    // Deduplicate overlapping spans
    const unique: DetectionSpan[] = [];
    for (const span of spans.sort((a, b) => a.start - b.start)) {
      if (!unique.some((u) => span.start < u.end && span.end > u.start)) {
        unique.push(span);
      }
    }

    return unique;
  },
};
