import { describe, expect, it } from 'vitest';

import { productIdentity } from '#shared/config/product-identity/product-identity';
import en from '#shared/i18n/locales/en.json';
import pl from '#shared/i18n/locales/pl.json';

describe('productIdentity', () => {
  it('defines the canonical public identity and recovery filenames', () => {
    expect(productIdentity).toEqual({
      name: 'NoAsterisk',
      markPath: '/favicon.svg',
      recoveryCodeFilename: 'noasterisk-recovery-code.txt',
      recoveryFilename: 'noasterisk-recovery.txt',
    });
  });

  it('keeps every brand-bearing locale surface aligned and free of retired copy', () => {
    const localizedBrandCopy = [
      [en.app.name, en.legal.privacy.intro, en.legal.terms.intro],
      [pl.app.name, pl.legal.privacy.intro, pl.legal.terms.intro],
    ];

    for (const [name, privacyIntro, termsIntro] of localizedBrandCopy) {
      expect(name).toBe(productIdentity.name);
      expect(privacyIntro).toContain(productIdentity.name);
      expect(termsIntro).toContain(productIdentity.name);
    }
    expect(JSON.stringify(localizedBrandCopy)).not.toMatch(/BudgetFlow/i);
  });
});
