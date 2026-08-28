import { describe, expect, it } from 'vitest';

import { hasIdContext } from './has-id-context';

describe('hasIdContext', () => {
  it('returns true when "dowód" appears before position', () => {
    const text = 'nr dowodu ABS 847291';
    expect(hasIdContext(text, 10)).toBe(true);
  });

  it('returns true when "dowód osobisty" appears before position', () => {
    const text = 'dowód osobisty ABS847291';
    expect(hasIdContext(text, 15)).toBe(true);
  });

  it('returns true for "tożsamości" context', () => {
    const text = 'dokument tożsamości ABS 847291';
    expect(hasIdContext(text, 20)).toBe(true);
  });

  it('returns false when no context keyword present', () => {
    const text = 'Seria ABS 847291 do odbioru';
    expect(hasIdContext(text, 6)).toBe(false);
  });

  it('returns false when context keyword is too far away', () => {
    const text = 'dowód osobisty jakiś bardzo długi tekst pośredni ABS 847291';
    expect(hasIdContext(text, 50)).toBe(false);
  });
});
