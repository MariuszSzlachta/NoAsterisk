import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { CategoryBreakdownFilters } from '#features/analytics/model/types';

import { useCategoryBreakdown } from './useCategoryBreakdown';

vi.mock('#features/analytics/api/useCategoryBreakdownQuery', () => ({
  useCategoryBreakdownQuery: () => ({
    status: 'loaded',
    data: [
      { category: 'Spożywcze', amount: 300, percentage: 60 },
      { category: 'Transport', amount: 200, percentage: 40 },
    ],
  }),
}));

const filters: CategoryBreakdownFilters = {
  metric: 'expenses',
  period: '6m',
  granularity: 'monthly',
};

describe('useCategoryBreakdown', () => {
  it('returns loaded state from query', () => {
    const { result } = renderHook(() => useCategoryBreakdown(filters));
    expect(result.current.state.status).toBe('loaded');
  });

  it('initially has no selected category', () => {
    const { result } = renderHook(() => useCategoryBreakdown(filters));
    expect(result.current.selectedCategory).toBeUndefined();
  });

  it('selects category on click', () => {
    const { result } = renderHook(() => useCategoryBreakdown(filters));

    act(() => {
      result.current.createCategoryClickHandler('Spożywcze')();
    });

    expect(result.current.selectedCategory).toBe('Spożywcze');
  });

  it('deselects category on second click (toggle)', () => {
    const { result } = renderHook(() => useCategoryBreakdown(filters));

    act(() => {
      result.current.createCategoryClickHandler('Spożywcze')();
    });
    act(() => {
      result.current.createCategoryClickHandler('Spożywcze')();
    });

    expect(result.current.selectedCategory).toBeUndefined();
  });

  it('switches to different category on click', () => {
    const { result } = renderHook(() => useCategoryBreakdown(filters));

    act(() => {
      result.current.createCategoryClickHandler('Spożywcze')();
    });
    act(() => {
      result.current.createCategoryClickHandler('Transport')();
    });

    expect(result.current.selectedCategory).toBe('Transport');
  });

  it('closes drilldown via handleDrilldownClose', () => {
    const { result } = renderHook(() => useCategoryBreakdown(filters));

    act(() => {
      result.current.createCategoryClickHandler('Spożywcze')();
    });
    act(() => {
      result.current.handleDrilldownClose();
    });

    expect(result.current.selectedCategory).toBeUndefined();
  });
});
