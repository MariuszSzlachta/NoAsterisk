import { describe, expect, it } from 'vitest';

import { createNipCompactPattern } from './create-nip-compact.pattern';

describe('createNipCompactPattern', () => {
  it('matches 10 consecutive digits', () => {
    const pattern = createNipCompactPattern();
    const matches = Array.from('NIP 1234563218 sp.'.matchAll(pattern));

    expect(matches).toHaveLength(1);
    expect(matches[0]?.[0]).toBe('1234563218');
  });

  it('does not match when embedded in longer number', () => {
    const pattern = createNipCompactPattern();
    const matches = Array.from('12345632189'.matchAll(pattern));

    expect(matches).toHaveLength(0);
  });
});
