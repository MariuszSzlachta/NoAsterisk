import type { DetectionSpan } from '../types';

type MaskFn = (original: string) => string;

const MASK_STRATEGIES: Record<string, MaskFn> = {
  iban: (s) => {
    const clean = s.replace(/^'/, '').replace(/\s/g, '');
    return `${clean.slice(0, 4)} •••• •••• ${clean.slice(-4)}`;
  },
  card: (s) => {
    const digits = s.replace(/\D/g, '');
    if (digits.length >= 8) {
      return `${digits.slice(0, 4)} •••• •••• ${digits.slice(-4)}`;
    }
    // Already masked pattern — keep as-is or standardize
    return `•••• •••• •••• ${s.slice(-4)}`;
  },
  pesel: (s) => {
    const digits = s.replace(/\D/g, '');
    return `${digits.slice(0, 2)}•••••••${digits.slice(-2)}`;
  },
  nip: (s) => {
    const digits = s.replace(/\D/g, '');
    return `${digits.slice(0, 3)}-•••-••-${digits.slice(-2)}`;
  },
  national_id: (s) => {
    return `${s.slice(0, 3)} ••••••`;
  },
  birth_date: () => {
    return 'ur. ••.••.••••';
  },
  name: (s) => {
    const parts = s.split(/[\s-]+/).filter((p) => p.length > 0);
    return parts
      .map((p) => `${p[0]}${'•'.repeat(Math.min(p.length - 1, 6))}`)
      .join(' ');
  },
  phone: (s) => {
    const digits = s.replace(/\D/g, '');
    return `••• ••• ${digits.slice(-3)}`;
  },
  email: (s) => {
    const atIdx = s.indexOf('@');
    if (atIdx <= 0) {
      return '•••@•••';
    }
    return `${s[0]}•••@${s.slice(atIdx + 1)}`;
  },
  address: (s) => {
    const prefix = s.match(/^(ul\.|al\.|os\.|pl\.|\d{2}-\d{3})/i);
    return prefix ? `${prefix[0]} •••` : '••• •••';
  },
};

/**
 * Mask a single detected PII span using type-specific strategy.
 */
export const maskSpan = (span: DetectionSpan): string =>
  (MASK_STRATEGIES[span.type] ?? ((o: string) => '•'.repeat(o.length)))(
    span.original,
  );

/**
 * Apply masking to all resolved spans in a text string.
 * Spans MUST be sorted by start position (non-overlapping).
 */
export const applyMasking = (
  text: string,
  spans: readonly DetectionSpan[],
): string => {
  if (spans.length === 0) {
    return text;
  }

  let result = '';
  let lastEnd = 0;
  for (const span of spans) {
    result += text.slice(lastEnd, span.start) + maskSpan(span);
    lastEnd = span.end;
  }
  result += text.slice(lastEnd);
  return result;
};
