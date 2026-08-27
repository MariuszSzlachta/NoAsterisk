import type { AmountLocale } from '../types';
import { NBSP } from '../shared/constants';

const normalizeWhitespace = (value: string): string =>
  value.replace(new RegExp(NBSP, 'g'), ' ').trim();

interface LocaleScore {
  readonly pl: number;
  readonly en: number;
}

const scoreSample = (raw: string): LocaleScore => {
  const s = normalizeWhitespace(raw.trim());
  if (!s || s === '') return { pl: 0, en: 0 };

  const stripped = s.replace(/^[()+-]+|[()]+$/g, '');
  const lastComma = stripped.lastIndexOf(',');
  const lastDot = stripped.lastIndexOf('.');

  if (lastComma > lastDot && lastComma > 0) {
    const afterComma = stripped.slice(lastComma + 1);
    if (afterComma.length <= 2 && /^\d+$/.test(afterComma)) return { pl: 1, en: 0 };
  }

  if (lastDot > lastComma && lastDot > 0) {
    const afterDot = stripped.slice(lastDot + 1);
    if (afterDot.length <= 2 && /^\d+$/.test(afterDot)) return { pl: 0, en: 1 };
  }

  if (/\d\s\d/.test(s)) return { pl: 1, en: 0 };

  return { pl: 0, en: 0 };
};

export const detectAmountLocale = (samples: readonly string[]): AmountLocale => {
  const totals = samples.reduce<LocaleScore>(
    (acc, sample) => {
      const score = scoreSample(sample);
      return { pl: acc.pl + score.pl, en: acc.en + score.en };
    },
    { pl: 0, en: 0 },
  );

  return totals.pl >= totals.en ? 'pl' : 'en';
};
