import { describe, expect, it } from 'vitest';

import { hasPeselContext } from './has-pesel-context';

describe('hasPeselContext', () => {
  it('returns true when "PESEL:" precedes the position', () => {
    const text = 'Nr PESEL: 44051401458';
    expect(hasPeselContext(text, 10)).toBe(true);
  });

  it('returns true when "numer pesel" precedes the position', () => {
    const text = 'Numer PESEL 44051401458';
    expect(hasPeselContext(text, 12)).toBe(true);
  });

  it('returns false when no context keyword is present', () => {
    const text = 'Identyfikator 44051401458';
    expect(hasPeselContext(text, 14)).toBe(false);
  });
});
