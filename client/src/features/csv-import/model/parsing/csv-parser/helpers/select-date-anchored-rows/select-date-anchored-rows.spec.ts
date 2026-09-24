import { describe, expect, it } from 'vitest';

import { selectDateAnchoredRows } from './select-date-anchored-rows';

describe('selectDateAnchoredRows', () => {
  const transaction = ['01.06.2025', '02.06.2025', 'Payment', '-10,00'];
  const localizedDate = ['14-CZE-2025', '', 'Refund', '+20,00'];
  const footer = ['=== PODSUMOWANIE ==='];
  const incomplete = ['', '', '', '100,00'];

  it('keeps transactions and removes non-transaction rows from a date-anchored statement', () => {
    expect(
      selectDateAnchoredRows(
        [transaction, footer, localizedDate, incomplete],
        true,
      ),
    ).toEqual([transaction, localizedDate]);
  });

  it('preserves rows when boundary detection used keyword fallback', () => {
    expect(selectDateAnchoredRows([footer, incomplete], false)).toEqual([
      footer,
      incomplete,
    ]);
  });
});
