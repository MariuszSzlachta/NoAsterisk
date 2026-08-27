import type { AmountLocale } from '#features/csv-import/model/parsing/types';

import { scoreSample } from './score-sample';

export const detectAmountLocale = (
  samples: readonly string[],
): AmountLocale => {
  const totals = samples.reduce<{ pl: number; en: number }>(
    (acc, sample) => {
      const score = scoreSample(sample);
      return { pl: acc.pl + score.pl, en: acc.en + score.en };
    },
    { pl: 0, en: 0 },
  );

  return totals.pl >= totals.en ? 'pl' : 'en';
};
