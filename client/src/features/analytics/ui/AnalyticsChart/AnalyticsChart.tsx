import { useTranslation } from 'react-i18next';

import { getSeriesColors } from '#features/analytics/model/getSeriesColors';
import { getXAxisTickValues } from '#features/analytics/model/getXAxisTickValues';
import { localizeChartSeriesLabels } from '#features/analytics/model/localizeChartSeriesLabels';
import type { AnalyticsSeries } from '#features/analytics/model/types';
import { LineChart } from '#shared/adapters/charts';
import { Card } from '#shared/ui/Card';

interface AnalyticsChartProps {
  readonly series: AnalyticsSeries[];
}

/**
 * Renders analytics chart data as a line chart.
 * Additional chart types (bar, area) will be implemented when shared adapters exist.
 */
export const AnalyticsChart = ({
  series,
}: AnalyticsChartProps): React.JSX.Element => {
  const { t } = useTranslation();
  const chartSeries = localizeChartSeriesLabels(series, t);
  const desktopTickValues = getXAxisTickValues(chartSeries, 12);
  const mobileTickValues = getXAxisTickValues(chartSeries);

  return (
    <Card className="!p-3 lg:!p-5">
      <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-2 px-1 lg:hidden">
        {chartSeries.map((item) => (
          <div
            key={item.id}
            className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground"
          >
            <span
              aria-hidden="true"
              className="h-2 w-2 shrink-0"
              style={{ backgroundColor: getSeriesColors([item.id])[0] }}
            />
            <span className="truncate">
              {t(`analytics.metrics.${item.id}`)}
            </span>
          </div>
        ))}
      </div>
      <LineChart
        data={chartSeries}
        height={320}
        colors={getSeriesColors(chartSeries.map((s) => s.id))}
        showGrid
        showLegend
        compactOnMobile
        hideLegendOnMobile
        xAxisLastTickOffset={6}
        mobileXAxisLastTickOffset={6}
        axisBottom={{
          label: '',
          tickValues: desktopTickValues,
          mobileTickValues,
        }}
      />
    </Card>
  );
};
