import { describe, expect, it } from 'vitest';

import { hasNipContext } from './has-nip-context';

describe('hasNipContext', () => {
  it('returns true when "NIP:" precedes the position', () => {
    const text = 'Firma NIP: 1234563218';
    expect(hasNipContext(text, 11)).toBe(true);
  });

  it('returns true when "nr nip" precedes the position', () => {
    const text = 'Nr NIP 1234563218';
    expect(hasNipContext(text, 7)).toBe(true);
  });

  it('returns false when no context keyword is present', () => {
    const text = 'Identyfikator 1234563218';
    expect(hasNipContext(text, 14)).toBe(false);
  });

  it('returns false when context keyword is too far away', () => {
    const text = 'NIP firmy jest bardzo daleko od numeru          1234563218';
    expect(hasNipContext(text, 48)).toBe(false);
  });
});
