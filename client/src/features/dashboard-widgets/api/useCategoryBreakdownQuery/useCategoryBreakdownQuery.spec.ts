import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { useCategoriesStore } from '#entities/category';
import { useTransactionsStore } from '#entities/transaction';

import { useCategoryBreakdownQuery } from './useCategoryBreakdownQuery';

const currentMonthDate = (day: string): string =>
  `${new Date().toISOString().slice(0, 7)}-${day}`;

describe('useCategoryBreakdownQuery', () => {
  afterEach(() => {
    useTransactionsStore.setState({ transactions: [] });
    useCategoriesStore.setState({ categories: [] });
  });

  it('returns category labels instead of category ids', () => {
    useCategoriesStore.setState({
      categories: [
        {
          id: 'cat-groceries',
          label: 'Zakupy spożywcze',
          color: '#4ade80',
        },
      ],
    });
    useTransactionsStore.setState({
      transactions: [
        {
          id: 'tx-1',
          date: currentMonthDate('10'),
          description: 'Sklep',
          amount: -125,
          currency: 'PLN',
          categoryId: 'cat-groceries',
          contentHash: 'hash-1',
          batchId: 'batch-1',
          importedAt: currentMonthDate('10'),
        },
      ],
    });

    const { result } = renderHook(() => useCategoryBreakdownQuery());

    expect(result.current).toEqual({
      status: 'loaded',
      data: [{ label: 'Zakupy spożywcze', value: 125 }],
    });
  });

  it('uses default category labels when the category store is empty', () => {
    useTransactionsStore.setState({
      transactions: [
        {
          id: 'tx-1',
          date: currentMonthDate('10'),
          description: 'Sklep',
          amount: -125,
          currency: 'PLN',
          categoryId: 'cat-groceries',
          contentHash: 'hash-1',
          batchId: 'batch-1',
          importedAt: currentMonthDate('10'),
        },
      ],
    });

    const { result } = renderHook(() => useCategoryBreakdownQuery());

    expect(result.current).toMatchObject({
      status: 'loaded',
      data: [{ label: 'Spożywcze' }],
    });
  });
});
