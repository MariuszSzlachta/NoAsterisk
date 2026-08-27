import { describe, expect, it } from 'vitest';

import { createNipCompactPattern, createNipDashedPattern } from './patterns';

describe('createNipDashedPattern', () => {
  it('matches dashed NIP format XXX-XXX-XX-XX', () => {
    const pattern = createNipDashedPattern();
    const matches = Array.from('NIP 123-456-32-18'.matchAll(pattern));

    expect(matches).toHaveLength(1);
    expect(matches[0]?.[0]).toBe('123-456-32-18');
  });

  it('does not match when embedded in longer number', () => {
    const pattern = createNipDashedPattern();
    const matches = Array.from('9123-456-32-189'.matchAll(pattern));

    expect(matches).toHaveLength(0);
  });
});

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
