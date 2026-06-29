import type { AnonymizationEntry, AnonymizationStatus, CsvRow, PiiMatch } from './types';

const IBAN_REGEX = /\b[A-Z]{2}\s?\d{2}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}\b/g;
const PHONE_REGEX = /(?:\+48\s?)?\b\d{3}[\s-]?\d{3}[\s-]?\d{3}\b/g;
const NAME_REGEX = /\b[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]{2,}\s+[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]{2,}\b/g;

const KNOWN_NON_NAMES = new Set([
  'Przelew Wychodzący', 'Przelew Przychodzący', 'Płatność Kartą',
  'Przelew Własny', 'Przelew Zagraniczny', 'Zlecenie Stałe',
]);

const maskIban = (iban: string): string => {
  const digits = iban.replace(/\s/g, '');
  return `${digits.slice(0, 4)} •••• •••• ${digits.slice(-4)}`;
};

const maskPhone = (phone: string): string => {
  const digits = phone.replace(/[\s+-]/g, '');
  return `•••• ${digits.slice(-3)}`;
};

const maskName = (name: string): string => {
  const parts = name.split(/\s+/);
  return parts.map((p) => `${p[0]}${'•'.repeat(p.length - 1)}`).join(' ');
};

export const detectPii = (text: string): PiiMatch[] => {
  const matches: PiiMatch[] = [];

  for (const match of text.matchAll(IBAN_REGEX)) {
    matches.push({
      start: match.index!,
      end: match.index! + match[0].length,
      type: 'iban',
      original: match[0],
      masked: maskIban(match[0]),
    });
  }

  for (const match of text.matchAll(PHONE_REGEX)) {
    matches.push({
      start: match.index!,
      end: match.index! + match[0].length,
      type: 'phone',
      original: match[0],
      masked: maskPhone(match[0]),
    });
  }

  for (const match of text.matchAll(NAME_REGEX)) {
    if (!KNOWN_NON_NAMES.has(match[0])) {
      matches.push({
        start: match.index!,
        end: match.index! + match[0].length,
        type: 'name',
        original: match[0],
        masked: maskName(match[0]),
      });
    }
  }

  return matches.sort((a, b) => a.start - b.start);
};

export const anonymize = (text: string, matches: readonly PiiMatch[]): string => {
  if (matches.length === 0) return text;

  let result = '';
  let lastEnd = 0;
  for (const m of matches) {
    result += text.slice(lastEnd, m.start) + m.masked;
    lastEnd = m.end;
  }
  result += text.slice(lastEnd);
  return result;
};

export const processRows = (
  rows: readonly CsvRow[],
  titleColumnKey: string,
): AnonymizationEntry[] =>
  rows.map((row, rowIndex) => {
    const originalTitle = row[titleColumnKey] ?? '';
    const matches = detectPii(originalTitle);
    const anonymizedTitle = anonymize(originalTitle, matches);
    const status: AnonymizationStatus =
      matches.length === 0 ? 'safe' : 'needs_review';

    return {
      rowIndex,
      originalTitle,
      anonymizedTitle,
      matches,
      status,
      accepted: matches.length === 0,
    };
  });
