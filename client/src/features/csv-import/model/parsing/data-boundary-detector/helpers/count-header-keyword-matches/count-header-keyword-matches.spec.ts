import { describe, expect, it } from 'vitest';

import { countHeaderKeywordMatches } from './count-header-keyword-matches';

describe('countHeaderKeywordMatches', () => {
  it('matches Vietnamese statement headers', () => {
    expect(
      countHeaderKeywordMatches(
        'Ngay GD|Ngay HL|Title|So tien (VND)|Loai|So du|Ma GD',
      ),
    ).toBeGreaterThanOrEqual(2);
  });

  it('normalizes Turkish dotted letters and diacritics', () => {
    expect(
      countHeaderKeywordMatches(
        'İşlem Tarihi;Valör;Açıklama/Description;Borç;Alacak;Bakiye',
      ),
    ).toBeGreaterThanOrEqual(2);
  });
});
