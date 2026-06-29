import type { DetectionSpan, DictionarySet, PiiDetector } from '../../types';

// Keywords after which names typically appear in Polish bank titles
const NAME_CONTEXT_KEYWORDS = [
  'przelew', 'od', 'dla', 'na rzecz', 'nadawca', 'odbiorca',
  'wpłata', 'wypłata', 'zleceniodawca', 'beneficjent',
];

// Mixed-case: "Jan Kowalski", "Anna Nowak-Wiśniewska"
const MIXED_CASE_NAME = /\b([A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]{2,})(?:[\s-]([A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]{2,})){1,2}\b/g;

// ALL-CAPS: 2-3 consecutive ALL-CAPS words (3+ letters each)
const ALL_CAPS_WORD = /\b[A-ZĄĆĘŁŃÓŚŹŻ]{3,}\b/g;

interface MatchCandidate {
  readonly original: string;
  readonly index: number;
}

/**
 * Find ALL-CAPS name candidates using regex for accurate positions.
 */
const findAllCapsNames = (text: string): MatchCandidate[] => {
  const results: MatchCandidate[] = [];
  const wordMatches: Array<{ word: string; start: number }> = [];

  ALL_CAPS_WORD.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = ALL_CAPS_WORD.exec(text)) !== null) {
    wordMatches.push({ word: m[0], start: m.index });
  }

  for (let i = 0; i < wordMatches.length - 1; i++) {
    const a = wordMatches[i];
    const b = wordMatches[i + 1];

    // Adjacent words (only whitespace/dash between them)
    const between = text.slice(a.start + a.word.length, b.start);
    if (!/^[\s-]+$/.test(between)) continue;

    const twoWord = text.slice(a.start, b.start + b.word.length);
    results.push({ original: twoWord, index: a.start });

    // Try 3-word
    if (i + 2 < wordMatches.length) {
      const c = wordMatches[i + 2];
      const between2 = text.slice(b.start + b.word.length, c.start);
      if (/^[\s-]+$/.test(between2)) {
        const threeWord = text.slice(a.start, c.start + c.word.length);
        results.push({ original: threeWord, index: a.start });
      }
    }
  }

  return results;
};

const isWhitelisted = (text: string, dicts: DictionarySet): boolean => {
  const upper = text.toUpperCase();
  const lower = text.toLowerCase();

  if (dicts.merchants.has(upper)) return true;

  const words = text.split(/[\s-]+/);
  if (words.every((w) => dicts.cities.has(w.toUpperCase()))) return true;
  if (dicts.phrases.has(lower)) return true;

  // Multi-word merchant check (e.g. "POCZTA POLSKA")
  if (words.length <= 3 && dicts.merchants.has(words.map((w) => w.toUpperCase()).join(' '))) return true;

  // All words are merchants/cities
  if (words.every((w) => dicts.merchants.has(w.toUpperCase()) || dicts.cities.has(w.toUpperCase()))) return true;

  return false;
};

const hasNameContext = (text: string, start: number): boolean => {
  const prefix = text.slice(Math.max(0, start - 30), start).toLowerCase();
  return NAME_CONTEXT_KEYWORDS.some((kw) => prefix.includes(kw));
};

const computeConfidence = (
  words: readonly string[],
  dicts: DictionarySet,
  hasContext: boolean,
): number => {
  const lowered = words.map((w) => w.toLowerCase());
  const anyFirstName = lowered.some((w) => dicts.firstNames.has(w));
  const anySurname = lowered.some((w) => dicts.surnames.has(w));

  if (anyFirstName && anySurname) return 0.95;
  if (anyFirstName && hasContext) return 0.85;
  if (anySurname && hasContext) return 0.82;
  if ((anyFirstName || anySurname) && !hasContext) return 0.72;
  if (hasContext) return 0.65;
  return 0.3;
};

const MIN_CONFIDENCE = 0.6;

export const nameDetector: PiiDetector = {
  id: 'name',
  priority: 50,

  detect(text: string, dictionaries: DictionarySet): readonly DetectionSpan[] {
    const spans: DetectionSpan[] = [];
    const seen = new Set<string>();

    const processCandidate = (candidate: MatchCandidate): void => {
      const { original, index: start } = candidate;
      const key = `${start}:${original.length}`;
      if (seen.has(key)) return;
      seen.add(key);

      if (isWhitelisted(original, dictionaries)) return;

      const words = original.split(/[\s-]+/);
      const hasContext = hasNameContext(text, start);
      const confidence = computeConfidence(words, dictionaries, hasContext);

      if (confidence < MIN_CONFIDENCE) return;

      spans.push({
        start,
        end: start + original.length,
        type: 'name',
        confidence,
        original,
        detectorId: 'name',
        metadata: {
          anyFirstNameInDict: words.some((w) => dictionaries.firstNames.has(w.toLowerCase())),
          anySurnameInDict: words.some((w) => dictionaries.surnames.has(w.toLowerCase())),
          hasContext,
        },
      });
    };

    // Mixed-case pattern
    MIXED_CASE_NAME.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = MIXED_CASE_NAME.exec(text)) !== null) {
      processCandidate({ original: match[0], index: match.index });
    }

    // ALL-CAPS candidates (with accurate position tracking via regex)
    for (const candidate of findAllCapsNames(text)) {
      processCandidate(candidate);
    }

    return spans;
  },
};
