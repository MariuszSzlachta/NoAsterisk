import { describe, expect, it } from 'vitest';

import {
  createIntPhonePattern,
  createNoSpacePrefixPattern,
  createPlPhonePattern,
} from './patterns';

describe('createPlPhonePattern', () => {
  it('matches +48 prefixed phone with spaces', () => {
    const pattern = createPlPhonePattern();
    const matches = Array.from('+48 601 234 567'.matchAll(pattern));

    expect(matches).toHaveLength(1);
    expect(matches[0]?.[0]).toBe('+48 601 234 567');
  });

  it('matches 9-digit phone without prefix', () => {
    const pattern = createPlPhonePattern();
    const matches = Array.from('tel 601234567'.matchAll(pattern));

    expect(matches).toHaveLength(1);
    expect(matches[0]?.[0]).toBe('601234567');
  });

  it('matches phone with dashes', () => {
    const pattern = createPlPhonePattern();
    const matches = Array.from('601-234-567'.matchAll(pattern));

    expect(matches).toHaveLength(1);
    expect(matches[0]?.[0]).toBe('601-234-567');
  });
});

describe('createIntPhonePattern', () => {
  it('matches international phone number', () => {
    const pattern = createIntPhonePattern();
    const matches = Array.from('+1 866 579 7172'.matchAll(pattern));

    expect(matches).toHaveLength(1);
    expect(matches[0]?.[0]).toBe('+1 866 579 7172');
  });

  it('matches +48 prefixed number', () => {
    const pattern = createIntPhonePattern();
    const matches = Array.from('+48 601 234 567'.matchAll(pattern));

    expect(matches).toHaveLength(1);
  });
});

describe('createNoSpacePrefixPattern', () => {
  it('matches parenthesized prefix with compact digits', () => {
    const pattern = createNoSpacePrefixPattern();
    const matches = Array.from('(+48)601234567'.matchAll(pattern));

    expect(matches).toHaveLength(1);
    expect(matches[0]?.[0]).toBe('(+48)601234567');
  });

  it('matches + prefix with compact digits', () => {
    const pattern = createNoSpacePrefixPattern();
    const matches = Array.from('+48601234567'.matchAll(pattern));

    expect(matches).toHaveLength(1);
    expect(matches[0]?.[0]).toBe('+48601234567');
  });
});
