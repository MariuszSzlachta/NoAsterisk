import { ResponsiveLine } from '@nivo/line';

import type { LineChartProps } from '#shared/charts/ports/chart.port';

import {
  CHART_MARGIN,
  DEFAULT_CHART_HEIGHT,
  LEGEND_BOTTOM_RIGHT,
} from '#shared/charts/adapters/nivo/nivo-defaults';

export const NivoLineChart = ({
  data,
  height = DEFAULT_CHART_HEIGHT,
  colors,
  showLegend,
  showGrid = true,
  axisBottom,
  axisLeft,
}: LineChartProps): React.JSX.Element => {
  return (
    <div style={{ height }}>
      <ResponsiveLine
        data={data}
        margin={CHART_MARGIN}
        xScale={{ type: 'point' }}
        yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
        enableGridX={showGrid}
        enableGridY={showGrid}
        colors={colors}
        axisBottom={axisBottom ? { legend: axisBottom.label } : undefined}
        axisLeft={axisLeft ? { legend: axisLeft.label } : undefined}
        legends={showLegend ? [LEGEND_BOTTOM_RIGHT] : []}
      />
    </div>
  );
};
