/**
 * Polish business entity abbreviations/forms.
 * Used by:
 * - name-detector: lookbehind context to suppress PII detection for company names
 * - phrases dictionary: whitelist filter to prevent flagging abbreviations themselves
 */
export const COMPANY_FORM_VARIANTS = [
  'p.h.u',
  'p.h.u.',
  'phu',
  'f.h.u',
  'f.h.u.',
  'fhu',
  'p.p.h.u',
  'p.p.h.u.',
  'pphu',
  'sp. z o.o.',
  'sp. z o.o',
  'sp.z o.o.',
  'spółka z o.o.',
  'spółka z ograniczoną odpowiedzialnością',
  's.c.',
  'sp.j.',
  'sp. j.',
  'spółka jawna',
  'sp.k.',
  'sp. k.',
  'spółka komandytowa',
  's.a.',
  'spółka akcyjna',
  'z.p.h.u',
  'z.p.h.u.',
  'zakład',
  'przedsiębiorstwo',
] as const;

/**
 * Subset used for lookbehind context matching in name-detector.
 * Only short abbreviation forms (not full words like "spółka jawna")
 * that appear directly before names in bank titles.
 */
export const COMPANY_PREFIX_ABBREVIATIONS = COMPANY_FORM_VARIANTS.filter(
  (v) =>
    (v.length <= 12 && /[.]/.test(v)) || ['phu', 'fhu', 'pphu'].includes(v),
);
