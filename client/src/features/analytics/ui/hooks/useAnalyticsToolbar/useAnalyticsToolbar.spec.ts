import { describe, expect, it, vi } from 'vitest';

import type { AnalyticsFilters } from '#features/analytics/model/types';

import { useAnalyticsToolbar } from './useAnalyticsToolbar';

const baseFilters: AnalyticsFilters = {
  metrics: ['expenses'],
  period: '6m',
  chartType: 'line',
  granularity: 'monthly',
};

describe('useAnalyticsToolbar', () => {
  it('toggles metric ON when not selected', () => {
    const onChange = vi.fn();
    const { createToggleMetricHandler } = useAnalyticsToolbar(baseFilters, onChange);

    createToggleMetricHandler('income')();

    expect(onChange).toHaveBeenCalledWith({
      ...baseFilters,
      metrics: ['expenses', 'income'],
    });
  });

  it('toggles metric OFF when already selected', () => {
    const filtersWithTwo: AnalyticsFilters = { ...baseFilters, metrics: ['expenses', 'income'] };
    const onChange = vi.fn();
    const { createToggleMetricHandler } = useAnalyticsToolbar(filtersWithTwo, onChange);

    createToggleMetricHandler('income')();

    expect(onChange).toHaveBeenCalledWith({
      ...filtersWithTwo,
      metrics: ['expenses'],
    });
  });

  it('prevents removing last metric', () => {
    const onChange = vi.fn();
    const { createToggleMetricHandler } = useAnalyticsToolbar(baseFilters, onChange);

    createToggleMetricHandler('expenses')();

    expect(onChange).not.toHaveBeenCalled();
  });

  it('sets period', () => {
    const onChange = vi.fn();
    const { createSetPeriodHandler } = useAnalyticsToolbar(baseFilters, onChange);

    createSetPeriodHandler('3m')();

    expect(onChange).toHaveBeenCalledWith({ ...baseFilters, period: '3m' });
  });

  it('sets chart type', () => {
    const onChange = vi.fn();
    const { createSetChartTypeHandler } = useAnalyticsToolbar(baseFilters, onChange);

    createSetChartTypeHandler('bar')();

    expect(onChange).toHaveBeenCalledWith({ ...baseFilters, chartType: 'bar' });
  });

  it('sets granularity', () => {
    const onChange = vi.fn();
    const { createSetGranularityHandler } = useAnalyticsToolbar(baseFilters, onChange);

    createSetGranularityHandler('weekly')();

    expect(onChange).toHaveBeenCalledWith({ ...baseFilters, granularity: 'weekly' });
  });
});
