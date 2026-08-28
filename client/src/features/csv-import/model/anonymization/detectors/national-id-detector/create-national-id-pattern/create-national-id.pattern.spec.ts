import { describe, expect, it } from 'vitest';

import { createNationalIdPattern } from './create-national-id.pattern';

describe('createNationalIdPattern', () => {
  it('matches 3-letter + space + 6-digit format', () => {
    const pattern = createNationalIdPattern();
    const matches = Array.from('nr dowodu ABS 847291 wydany'.matchAll(pattern));

    expect(matches).toHaveLength(1);
    expect(matches[0]?.[0]).toBe('ABS 847291');
    expect(matches[0]?.[1]).toBe('ABS');
    expect(matches[0]?.[2]).toBe('847291');
  });

  it('matches compact format without space', () => {
    const pattern = createNationalIdPattern();
    const matches = Array.from('dowód ABS847291'.matchAll(pattern));

    expect(matches).toHaveLength(1);
    expect(matches[0]?.[0]).toBe('ABS847291');
  });

  it('does not match 2-letter prefix (only 3+)', () => {
    const pattern = createNationalIdPattern();
    const matches = Array.from('AB 123456 test'.matchAll(pattern));

    expect(matches).toHaveLength(0);
  });

  it('does not match 4-letter prefix', () => {
    const pattern = createNationalIdPattern();
    const matches = Array.from('ABCD 123456 test'.matchAll(pattern));

    expect(matches).toHaveLength(0);
  });

  it('does not match 5-digit number', () => {
    const pattern = createNationalIdPattern();
    const matches = Array.from('ABS 12345 test'.matchAll(pattern));

    expect(matches).toHaveLength(0);
  });

  it('returns fresh regex instance each call', () => {
    const a = createNationalIdPattern();
    const b = createNationalIdPattern();

    expect(a).not.toBe(b);
  });
});
