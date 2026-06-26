import { ResponsiveBar } from '@nivo/bar';

import type { BarChartProps } from '#shared/charts/ports/chart.port';

import {
  CHART_MARGIN,
  DEFAULT_CHART_HEIGHT,
  LEGEND_BOTTOM_RIGHT,
} from '#shared/charts/adapters/nivo/nivo-defaults';

export const NivoBarChart = ({
  data,
  height = DEFAULT_CHART_HEIGHT,
  colors,
  showLegend,
  showGrid = true,
  axisBottom,
  axisLeft,
}: BarChartProps): React.JSX.Element => {
  const barData = data.map((d) => ({ id: d.label, value: d.value }));

  return (
    <div style={{ height }}>
      <ResponsiveBar
        data={barData}
        keys={['value']}
        indexBy="id"
        margin={CHART_MARGIN}
        enableGridY={showGrid}
        colors={colors}
        axisBottom={axisBottom ? { legend: axisBottom.label } : undefined}
        axisLeft={axisLeft ? { legend: axisLeft.label } : undefined}
        legends={
          showLegend
            ? [{ ...LEGEND_BOTTOM_RIGHT, dataFrom: 'keys' as const }]
            : []
        }
      />
    </div>
  );
};
