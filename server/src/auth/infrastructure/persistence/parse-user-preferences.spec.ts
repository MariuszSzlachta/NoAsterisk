import { parseUserPreferences } from '@auth/infrastructure/persistence/parse-user-preferences';

describe('parseUserPreferences', () => {
  it('parses valid persisted preferences', () => {
    expect(
      parseUserPreferences({
        currency: 'PLN',
        dateFormat: 'DD.MM.YYYY',
        language: 'pl',
        theme: 'dark',
        homePage: 'dashboard',
      }),
    ).toEqual({
      currency: 'PLN',
      dateFormat: 'DD.MM.YYYY',
      language: 'pl',
      theme: 'dark',
      homePage: 'dashboard',
    });
  });

  it('rejects corrupted persisted preferences', () => {
    expect(() => parseUserPreferences({ currency: 'BTC' })).toThrow(
      'Corrupted DB data: invalid user preferences',
    );
  });
});
