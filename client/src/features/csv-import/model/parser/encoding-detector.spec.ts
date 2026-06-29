import { describe, expect, it } from 'vitest';

import { decodeBuffer, detectEncoding } from './encoding-detector';

const toBuffer = (bytes: number[]): ArrayBuffer => new Uint8Array(bytes).buffer;

const textToBuffer = (text: string): ArrayBuffer => new TextEncoder().encode(text).buffer;

describe('detectEncoding', () => {
  it('detects UTF-8 BOM', () => {
    const buffer = toBuffer([0xEF, 0xBB, 0xBF, 0x68, 0x65, 0x6C, 0x6C, 0x6F]);
    expect(detectEncoding(buffer)).toBe('utf-8');
  });

  it('detects plain UTF-8 text', () => {
    const buffer = textToBuffer('Data operacji;Opis;Kwota\n2026-01-01;BIEDRONKA;-87,43\n');
    expect(detectEncoding(buffer)).toBe('utf-8');
  });

  it('detects Windows-1250 from Polish chars', () => {
    // "ąęćś" in Windows-1250: ą=0xB9, ę=0xEA, ć=0xE6, ś=0x9C
    const header = [0x44, 0x61, 0x74, 0x61]; // "Data"
    const polishChars = [0xB9, 0xEA, 0xE6, 0x9C]; // ąęćś in Win-1250
    const buffer = toBuffer([...header, ...polishChars, ...new Array(100).fill(0x20)]);
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
