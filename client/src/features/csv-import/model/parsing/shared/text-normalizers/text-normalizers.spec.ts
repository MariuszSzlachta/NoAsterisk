import { describe, expect, it } from 'vitest';

import {
  normalizeCrlf,
  normalizeNbsp,
  normalizeWhitespace,
  stripBom,
} from './index';

describe('stripBom', () => {
  it('strips BOM from start', () => {
    expect(stripBom('\uFEFFData')).toBe('Data');
  });

  it('returns unchanged when no BOM', () => {
    expect(stripBom('Data')).toBe('Data');
  });

  it('handles empty string', () => {
    expect(stripBom('')).toBe('');
  });
});

describe('normalizeCrlf', () => {
  it('replaces \\r\\n with \\n', () => {
    expect(normalizeCrlf('a\r\nb\r\nc')).toBe('a\nb\nc');
  });

  it('replaces standalone \\r with \\n', () => {
    expect(normalizeCrlf('a\rb\rc')).toBe('a\nb\nc');
  });

  it('leaves \\n unchanged', () => {
    expect(normalizeCrlf('a\nb')).toBe('a\nb');
  });
});

describe('normalizeNbsp', () => {
  it('replaces NBSP with regular space', () => {
    expect(normalizeNbsp('1\u00A0234')).toBe('1 234');
  });

  it('replaces multiple NBSPs', () => {
    expect(normalizeNbsp('1\u00A0234\u00A0567')).toBe('1 234 567');
  });

  it('returns unchanged when no NBSP', () => {
    expect(normalizeNbsp('hello')).toBe('hello');
  });
});

describe('normalizeWhitespace', () => {
  it('replaces NBSP and trims', () => {
    expect(normalizeWhitespace('  1\u00A0234  ')).toBe('1 234');
  });

  it('trims regular whitespace', () => {
    expect(normalizeWhitespace('  hello  ')).toBe('hello');
  });

  it('returns empty for whitespace-only', () => {
    expect(normalizeWhitespace('   ')).toBe('');
  });
});
