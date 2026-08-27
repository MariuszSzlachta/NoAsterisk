import { describe, expect, it } from 'vitest';

import { matchesBom, normalizeEncoding } from './detect-encoding';

describe('normalizeEncoding', () => {
  it.each([
    ['windows-1250', 'windows-1250'],
    ['Windows-1250', 'windows-1250'],
    ['WINDOWS_1250', 'windows-1250'],
    ['windows1250', 'windows-1250'],
    ['cp1250', 'windows-1250'],
  ])('normalizes "%s" → "%s" (windows-1250 variants)', (input, expected) => {
    expect(normalizeEncoding(input)).toBe(expected);
  });

  it.each([
    ['windows-1252', 'windows-1250'],
    ['Windows_1252', 'windows-1250'],
  ])('normalizes "%s" → "%s" (windows-1252 mapped to windows-1250 for PL)', (input, expected) => {
    expect(normalizeEncoding(input)).toBe(expected);
  });

  it.each([
    ['utf-8', 'utf-8'],
    ['UTF-8', 'utf-8'],
    ['UTF_8', 'utf-8'],
    ['utf8', 'utf-8'],
  ])('normalizes "%s" → "%s" (utf-8 variants)', (input, expected) => {
    expect(normalizeEncoding(input)).toBe(expected);
  });

  it.each([
    ['iso-8859-2', 'iso-8859-2'],
    ['ISO-8859-2', 'iso-8859-2'],
    ['ISO_8859_2', 'iso-8859-2'],
    ['latin2', 'iso-8859-2'],
  ])('normalizes "%s" → "%s" (iso-8859-2 variants)', (input, expected) => {
    expect(normalizeEncoding(input)).toBe(expected);
  });

  it.each([
    ['ascii', 'utf-8'],
    ['ASCII', 'utf-8'],
    ['US-ASCII', 'utf-8'],
    ['us_ascii', 'utf-8'],
  ])('normalizes "%s" → "%s" (ascii variants mapped to utf-8)', (input, expected) => {
    expect(normalizeEncoding(input)).toBe(expected);
  });

  it('returns lowercased input for unknown encoding', () => {
    expect(normalizeEncoding('KOI8-R')).toBe('koi8-r');
  });
});

describe('matchesBom', () => {
  it('matches UTF-8 BOM', () => {
    const bytes = new Uint8Array([0xef, 0xbb, 0xbf, 0x48, 0x65]);
    expect(matchesBom(bytes, [0xef, 0xbb, 0xbf])).toBe(true);
  });

  it('matches UTF-16LE BOM', () => {
    const bytes = new Uint8Array([0xff, 0xfe, 0x48, 0x00]);
    expect(matchesBom(bytes, [0xff, 0xfe])).toBe(true);
  });

  it('returns false when no BOM present', () => {
    const bytes = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
    expect(matchesBom(bytes, [0xef, 0xbb, 0xbf])).toBe(false);
  });

  it('returns false for partial BOM match', () => {
    const bytes = new Uint8Array([0xef, 0xbb, 0x00]);
    expect(matchesBom(bytes, [0xef, 0xbb, 0xbf])).toBe(false);
  });

  it('returns true for empty BOM (vacuous truth)', () => {
    const bytes = new Uint8Array([0x48, 0x65]);
    expect(matchesBom(bytes, [])).toBe(true);
  });
});

