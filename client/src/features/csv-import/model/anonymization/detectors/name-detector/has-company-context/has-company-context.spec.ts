import { describe, expect, it } from 'vitest';

import { hasCompanyContext } from '#features/csv-import/model/anonymization/detectors/name-detector/has-company-context';

describe('hasCompanyContext', () => {
  it('returns true when company prefix found before start', () => {
    expect(hasCompanyContext('sp. z o.o. Jan Kowalski', 11)).toBe(true);
  });

  it('returns false when no company prefix before start', () => {
    expect(hasCompanyContext('Przelew Jan Kowalski', 9)).toBe(false);
  });

  it('returns true for PHU abbreviation', () => {
    expect(hasCompanyContext('PHU Jan Kowalski', 4)).toBe(true);
  });
});
