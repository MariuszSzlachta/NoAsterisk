import { useMemo } from 'react';

import type { ChartDataPoint } from '#shared/adapters/charts';

const SMALL_CATEGORY_THRESHOLD = 0.03;

export interface LegendItem {
  readonly label: string;
  readonly percent: number;
  readonly color: string;
  readonly isGrouped: boolean;
  readonly groupedCount?: number;
}

export const useCategoryLegend = (
  data: ChartDataPoint[],
  colors: string[],
): LegendItem[] => {
  return useMemo(() => {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    if (total === 0) return [];

    const items: LegendItem[] = [];
    let groupedValue = 0;
    let groupedCount = 0;

    for (let i = 0; i < data.length; i++) {
      const item = data[i]!;
      const percent = item.value / total;

      if (data.length > 12 && percent < SMALL_CATEGORY_THRESHOLD) {
        groupedValue += item.value;
        groupedCount++;
      } else {
        items.push({
          label: item.label,
          percent: Math.round(percent * 100),
          color: colors[i % colors.length],
          isGrouped: false,
        });
      }
    }

    if (groupedCount > 0) {
      items.push({
        label: `Inne (${groupedCount} kategorii)`,
        percent: Math.round((groupedValue / total) * 100),
        color: 'var(--fg-subtle)',
        isGrouped: true,
        groupedCount,
      });
    }

    return items;
  }, [data, colors]);
};
