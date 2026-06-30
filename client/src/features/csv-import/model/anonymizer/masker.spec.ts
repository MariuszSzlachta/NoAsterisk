import { describe, expect, it } from 'vitest';

import type { DetectionSpan } from '../types';
import { applyMasking, maskSpan } from './masker';

const makeSpan = (
  overrides: Partial<DetectionSpan> & {
    start: number;
    end: number;
    type: DetectionSpan['type'];
    original: string;
  },
): DetectionSpan => ({
  confidence: 0.95,
  detectorId: overrides.type,
  ...overrides,
});

describe('maskSpan', () => {
  describe('iban strategy', () => {
    it('shows first 4 + last 4 chars', () => {
      const span = makeSpan({
        start: 0,
        end: 32,
        type: 'iban',
        original: 'PL61 1090 1014 0000 0712 1981 2874',
      });

      const result = maskSpan(span);

      expect(result).toBe('PL61 •••• •••• 2874');
    });

    it('handles compact IBAN', () => {
      const span = makeSpan({
        start: 0,
        end: 28,
        type: 'iban',
        original: 'PL61109010140000071219812874',
      });

      const result = maskSpan(span);

      expect(result).toBe('PL61 •••• •••• 2874');
    });
  });

  describe('card strategy', () => {
    it('shows first 4 + last 4 for full number', () => {
      const span = makeSpan({
        start: 0,
        end: 19,
        type: 'card',
        original: '4532 0151 2345 6789',
      });

      const result = maskSpan(span);

      expect(result).toBe('4532 •••• •••• 6789');
    });

    it('handles already-masked short pattern', () => {
      const span = makeSpan({
        start: 0,
        end: 8,
        type: 'card',
        original: '****4820',
      });

      const result = maskSpan(span);

      // digits.length < 8, uses short path
      expect(result).toContain('4820');
      expect(result).toContain('••••');
    });
  });

  describe('name strategy', () => {
    it('masks first + last name', () => {
      const span = makeSpan({
        start: 0,
        end: 12,
        type: 'name',
        original: 'Jan Kowalski',
      });

      const result = maskSpan(span);

      expect(result).toBe('J•• K••••••');
    });

    it('masks single word name', () => {
      const span = makeSpan({
        start: 0,
        end: 3,
        type: 'name',
        original: 'Jan',
      });

      const result = maskSpan(span);

      expect(result).toBe('J••');
    });

    it('masks compound surname (hyphenated)', () => {
      const span = makeSpan({
        start: 0,
        end: 20,
        type: 'name',
        original: 'Anna Nowak-Wiśniewska',
      });

      const result = maskSpan(span);

      expect(result).toBe('A••• N•••• W••••••');
    });
  });

  describe('phone strategy', () => {
    it('shows last 3 digits', () => {
      const span = makeSpan({
        start: 0,
        end: 15,
        type: 'phone',
        original: '+48 601 234 567',
      });

      const result = maskSpan(span);

      expect(result).toBe('••• ••• 567');
    });
  });

  describe('email strategy', () => {
    it('shows first char + domain', () => {
      const span = makeSpan({
        start: 0,
        end: 22,
        type: 'email',
        original: 'jan.kowalski@gmail.com',
      });

      const result = maskSpan(span);

      expect(result).toBe('j•••@gmail.com');
    });

    it('handles edge case without @', () => {
      const span = makeSpan({
        start: 0,
        end: 5,
        type: 'email',
        original: 'notat',
      });

      const result = maskSpan(span);

      expect(result).toBe('•••@•••');
    });
  });

  describe('address strategy', () => {
    it('preserves street prefix', () => {
      const span = makeSpan({
        start: 0,
        end: 20,
        type: 'address',
        original: 'ul. Marszałkowska 15',
      });

      const result = maskSpan(span);

      expect(result).toBe('ul. •••');
    });

    it('preserves postal code prefix', () => {
      const span = makeSpan({
        start: 0,
        end: 18,
        type: 'address',
        original: '00-123 Bielsko-Biała',
      });

      const result = maskSpan(span);

      expect(result).toBe('00-123 •••');
    });

    it('falls back to dots for unknown format', () => {
      const span = makeSpan({
        start: 0,
        end: 10,
        type: 'address',
        original: 'Nowa Wieś 5',
      });

      const result = maskSpan(span);

      expect(result).toBe('••• •••');
    });
  });

  describe('unknown type', () => {
    it('replaces entire text with bullets', () => {
      const span = makeSpan({
        start: 0,
        end: 5,
        type: 'iban' as DetectionSpan['type'], // hack — simulate unknown via runtime
        original: 'hello',
      });
      // Simulate unknown type at runtime
      const hackedSpan = { ...span, type: 'unknown' as DetectionSpan['type'] };

      const result = maskSpan(hackedSpan);

      expect(result).toBe('•••••');
    });
  });
});

describe('applyMasking', () => {
  it('returns original text when no spans', () => {
    expect(applyMasking('Hello world', [])).toBe('Hello world');
  });

  it('masks single span in middle of text', () => {
    const text = 'PRZELEW Jan Kowalski za mieszkanie';
    const spans = [
      makeSpan({
        start: 8,
        end: 20,
        type: 'name',
        original: 'Jan Kowalski',
      }),
    ];

    const result = applyMasking(text, spans);

    expect(result).toBe('PRZELEW J•• K•••••• za mieszkanie');
  });

  it('masks multiple consecutive spans', () => {
    const text = 'Od Jan Kowalski tel 601234567';
    const spans = [
      makeSpan({
        start: 3,
        end: 15,
        type: 'name',
        original: 'Jan Kowalski',
      }),
      makeSpan({
        start: 20,
        end: 29,
        type: 'phone',
        original: '601234567',
      }),
    ];

    const result = applyMasking(text, spans);

    expect(result).toContain('J•• K••••••');
    expect(result).toContain('••• ••• 567');
    expect(result).toContain('Od ');
    expect(result).toContain(' tel ');
  });

  it('handles span at start of text', () => {
    const text = 'Jan Kowalski przelew';
    const spans = [
      makeSpan({
        start: 0,
        end: 12,
        type: 'name',
        original: 'Jan Kowalski',
      }),
    ];

    const result = applyMasking(text, spans);

    expect(result).toBe('J•• K•••••• przelew');
  });

  it('handles span at end of text', () => {
    const text = 'przelew od Jan Kowalski';
    const spans = [
      makeSpan({
        start: 11,
        end: 23,
        type: 'name',
        original: 'Jan Kowalski',
      }),
    ];

    const result = applyMasking(text, spans);

    expect(result).toBe('przelew od J•• K••••••');
  });
});
