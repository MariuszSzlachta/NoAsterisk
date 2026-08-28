import { describe, expect, it } from 'vitest';

import { createNipDashedPattern } from './create-nip-dashed.pattern';

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
