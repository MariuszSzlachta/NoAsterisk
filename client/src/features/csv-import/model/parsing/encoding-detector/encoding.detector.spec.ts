import { describe, expect, it } from 'vitest';

import {
  countReplacementChars,
  decodeBuffer,
  decodeBufferWithWarning,
  detectEncoding,
} from './encoding.detector';

const toBuffer = (bytes: number[]): ArrayBuffer => new Uint8Array(bytes).buffer;

const textToBuffer = (text: string): ArrayBuffer =>
  new TextEncoder().encode(text).buffer;

describe('detectEncoding', () => {
  it('detects UTF-8 BOM', () => {
    const buffer = toBuffer([0xef, 0xbb, 0xbf, 0x68, 0x65, 0x6c, 0x6c, 0x6f]);
    expect(detectEncoding(buffer)).toBe('utf-8');
  });

  it('detects plain UTF-8 text', () => {
    const buffer = textToBuffer(
      'Data operacji;Opis;Kwota\n2026-01-01;BIEDRONKA;-87,43\n',
    );
    expect(detectEncoding(buffer)).toBe('utf-8');
  });

  it('detects Windows-1250 from Polish chars', () => {
    // "ąęćś" in Windows-1250: ą=0xB9, ę=0xEA, ć=0xE6, ś=0x9C
    const header = [0x44, 0x61, 0x74, 0x61]; // "Data"
    const polishChars = [0xb9, 0xea, 0xe6, 0x9c]; // ąęćś in Win-1250
    const buffer = toBuffer([
      ...header,
      ...polishChars,
      ...new Array(100).fill(0x20),
    ]);
    expect(detectEncoding(buffer)).toBe('windows-1250');
  });

  it('returns utf-8 as fallback for plain ASCII', () => {
    const buffer = textToBuffer('Col1,Col2,Col3\na,b,c\n');
    expect(detectEncoding(buffer)).toBe('utf-8');
  });
});

describe('decodeBuffer', () => {
  it('decodes UTF-8 correctly', () => {
    const text = 'Żółć i barszcz';
    const buffer = textToBuffer(text);
    expect(decodeBuffer(buffer, 'utf-8')).toBe(text);
  });

  it('decodes ASCII subset as UTF-8', () => {
    const buffer = textToBuffer('Hello World');
    expect(decodeBuffer(buffer, 'utf-8')).toBe('Hello World');
  });
});

describe('countReplacementChars', () => {
  it('returns 0 for clean text', () => {
    expect(countReplacementChars('Hello World')).toBe(0);
    expect(countReplacementChars('Żółć i barszcz')).toBe(0);
  });

  it('counts single replacement character', () => {
    expect(countReplacementChars('Hello \uFFFD World')).toBe(1);
  });

  it('counts multiple replacement characters', () => {
    expect(countReplacementChars('\uFFFD\uFFFD\uFFFD')).toBe(3);
    expect(countReplacementChars('a\uFFFDb\uFFFDc')).toBe(2);
  });

  it('returns 0 for empty string', () => {
    expect(countReplacementChars('')).toBe(0);
  });
});

describe('decodeBufferWithWarning', () => {
  it('returns no warning for clean UTF-8 text', () => {
    const buffer = textToBuffer('Żółć i barszcz');
    const result = decodeBufferWithWarning(buffer, 'utf-8');

    expect(result.text).toBe('Żółć i barszcz');
    expect(result.warning).toBeUndefined();
  });

  it('returns warning when replacement chars present', () => {
    // Decode Windows-1250 bytes as UTF-8 → will produce replacement chars
    // ą in Win-1250 = 0xB9, which is invalid in UTF-8
    const bytes = [0x48, 0x65, 0x6c, 0x6c, 0x6f, 0xb9, 0xea]; // "Hello" + Win-1250 ąę
    const buffer = toBuffer(bytes);
    const result = decodeBufferWithWarning(buffer, 'utf-8');

    expect(result.warning).toBeDefined();
    expect(result.warning?.replacementCharCount).toBeGreaterThan(0);
    expect(result.warning?.message).toContain('unreadable character');
    expect(result.warning?.message).toContain('utf-8');
  });

  it('includes encoding name in warning message', () => {
    const bytes = [0xb9, 0xea]; // invalid UTF-8 bytes
    const buffer = toBuffer(bytes);
    const result = decodeBufferWithWarning(buffer, 'utf-8');

    expect(result.warning?.message).toContain('utf-8');
  });
});
