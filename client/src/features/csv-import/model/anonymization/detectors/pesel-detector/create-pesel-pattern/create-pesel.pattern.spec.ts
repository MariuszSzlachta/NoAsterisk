import { describe, expect, it } from 'vitest';

import { createPeselPattern } from './create-pesel.pattern';

describe('createPeselPattern', () => {
  it('matches 11 consecutive digits', () => {
    const pattern = createPeselPattern();
    const matches = Array.from('PESEL: 44051401458'.matchAll(pattern));

    expect(matches).toHaveLength(1);
    expect(matches[0]?.[0]).toBe('44051401458');
  });

  it('does not match when embedded in longer number', () => {
    const pattern = createPeselPattern();
    const matches = Array.from('123456789012'.matchAll(pattern));

    expect(matches).toHaveLength(0);
  });

  it('matches standalone 11-digit number', () => {
    const pattern = createPeselPattern();
    const matches = Array.from('Nr 44051401458 w systemie'.matchAll(pattern));

    expect(matches).toHaveLength(1);
    expect(matches[0]?.[1]).toBe('44051401458');
  });
});
