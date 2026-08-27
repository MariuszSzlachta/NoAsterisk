import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createImportGridColumns } from './grid-columns';

const t = (key: string): string => key;

describe('createImportGridColumns', () => {
  const columns = createImportGridColumns(t);
  const amountCol = columns.find((c) => c.field === 'amount');

  describe('amount cellRenderer', () => {
    const renderAmount = (value: unknown): string => {
      const renderer = amountCol?.cellRenderer;
      if (!renderer) {
        throw new Error('amount column has no cellRenderer');
      }
      const { container } = render(
        renderer({
          value,
          data: {} as never,
          rowIndex: 0,
        }) as React.ReactElement,
      );
      return container.textContent ?? '';
    };

    it('renders dash for NaN', () => {
      expect(renderAmount(NaN)).toBe('—');
    });

    it('renders dash for Infinity', () => {
      expect(renderAmount(Infinity)).toBe('—');
    });

    it('renders dash for undefined', () => {
      expect(renderAmount(undefined)).toBe('—');
    });

    it('renders dash for non-number string', () => {
      expect(renderAmount('abc')).toBe('—');
    });

    it('renders positive amount with + prefix', () => {
      const text = renderAmount(1234.56);
      expect(text).toContain('+');
      expect(text).toContain('1');
      expect(text).toContain('234');
    });

    it('renders negative amount with − prefix', () => {
      const text = renderAmount(-87.43);
      expect(text).toContain('−');
      expect(text).toContain('87');
    });
  });

  describe('amount comparator', () => {
    const comparator = amountCol?.comparator;

    it('exists on amount column', () => {
      expect(comparator).toBeDefined();
    });

    it('sorts numbers correctly', () => {
      expect(comparator!(100, 50, {} as never, {} as never)).toBeGreaterThan(0);
      expect(comparator!(-100, 50, {} as never, {} as never)).toBeLessThan(0);
      expect(comparator!(50, 50, {} as never, {} as never)).toBe(0);
    });

    it('sorts NaN values to the end (before any real number)', () => {
      // NaN is "less than" any real number → sorts last in descending
      expect(comparator!(NaN, 100, {} as never, {} as never)).toBeLessThan(0);
      expect(comparator!(100, NaN, {} as never, {} as never)).toBeGreaterThan(
        0,
      );
      // Two NaN are equal
      expect(comparator!(NaN, NaN, {} as never, {} as never)).toBe(0);
    });
  });
});
