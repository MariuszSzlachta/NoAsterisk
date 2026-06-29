import type { AnalyticsKpi } from '#features/analytics/model/types';

const TREND_CLASS: Record<AnalyticsKpi['trend'], string> = {
  up: 'text-income',
  down: 'text-expense',
  neutral: 'text-muted-foreground',
};

const TREND_CLASS_INVERTED: Record<AnalyticsKpi['trend'], string> = {
  up: 'text-expense',
  down: 'text-income',
  neutral: 'text-muted-foreground',
};

export const getTrendClass = (
  trend: AnalyticsKpi['trend'],
  inverted?: boolean,
): string => (inverted ? TREND_CLASS_INVERTED[trend] : TREND_CLASS[trend]);
