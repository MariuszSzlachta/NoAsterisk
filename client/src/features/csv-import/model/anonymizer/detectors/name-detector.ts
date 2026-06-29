import type { DetectionSpan, DictionarySet, PiiDetector } from '../../types';

// Keywords after which names typically appear in Polish bank titles
const NAME_CONTEXT_KEYWORDS = [
  'przelew', 'od', 'dla', 'na rzecz', 'nadawca', 'odbiorca',
  'wpłata', 'wypłata', 'zleceniodawca', 'beneficjent',
];

// Mixed-case: "Jan Kowalski", "Anna Nowak-Wiśniewska"
const MIXED_CASE_NAME = /\b([A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]{2,})(?:[\s-]([A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]{2,})){1,2}\b/g;

// ALL-CAPS: extract 2-3 word candidates near context keywords
const findAllCapsNames = (text: string): Array<{ start: number; original: string }> => {
  const results: Array<{ start: number; original: string }> = [];
  const words = text.split(/\s+/);
  let pos = 0;

  for (let i = 0; i < words.length; i++) {
    const wordStart = text.indexOf(words[i], pos);
    pos = wordStart + words[i].length;

    // Check if this word starts a potential ALL-CAPS name (2-3 words, 3+ chars each)
    const isAllCaps = (w: string): boolean => /^[A-ZĄĆĘŁŃÓŚŹŻ]{3,}$/.test(w);

    if (isAllCaps(words[i]) && i + 1 < words.length && isAllCaps(words[i + 1])) {
      // Try 2-word match
      const twoWord = `${words[i]} ${words[i + 1]}`;
      results.push({ start: wordStart, original: twoWord });

      // Try 3-word match
      if (i + 2 < words.length && isAllCaps(words[i + 2])) {
        const threeWord = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
        results.push({ start: wordStart, original: threeWord });
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

  // Single word in merchants — only if ALL words are merchants/cities (avoid "ADAM" false match)
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
  // Check both positions (first/last name can be in either order)
  const lowered = words.map((w) => w.toLowerCase());
  const anyFirstName = lowered.some((w) => dicts.firstNames.has(w));
  const anySurname = lowered.some((w) => dicts.surnames.has(w));

  if (anyFirstName && anySurname) return 0.95;
  if (anyFirstName && hasContext) return 0.85;
  if (anySurname && hasContext) return 0.82;
  if ((anyFirstName || anySurname) && !hasContext) return 0.72;
  if (hasContext) return 0.65;
  return 0.3; // No evidence — don't report (below threshold)
};

const MIN_CONFIDENCE = 0.6;

export const nameDetector: PiiDetector = {
  id: 'name',
  priority: 50,

  detect(text: string, dictionaries: DictionarySet): readonly DetectionSpan[] {
    const spans: DetectionSpan[] = [];
    const seen = new Set<string>();

    const processMatch = (match: RegExpExecArray): void => {
      const original = match[0];
      const start = match.index;
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

    // Run both patterns
    MIXED_CASE_NAME.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = MIXED_CASE_NAME.exec(text)) !== null) processMatch(match);

    // ALL-CAPS candidates
    for (const candidate of findAllCapsNames(text)) {
      const fakeMatch = [candidate.original] as unknown as RegExpExecArray;
      fakeMatch.index = candidate.start;
      processMatch(fakeMatch);
    }

    return spans;
  },
};
