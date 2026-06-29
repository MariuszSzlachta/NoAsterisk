import { useMemo } from 'react';

import type { ChartDataPoint } from '#shared/adapters/charts';

const INNE_PREFIX = 'Inne (';

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
    if (total === 0) {
      return [];
    }

    return data.map((item, i) => {
      const isGrouped = item.label.startsWith(INNE_PREFIX);
      return {
        label: item.label,
        percent: Math.round((item.value / total) * 100),
        color: isGrouped ? 'var(--fg-subtle)' : colors[i % colors.length],
        isGrouped,
      };
    });
  }, [data, colors]);
};
