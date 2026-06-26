import { ResponsivePie } from '@nivo/pie';

import type { PieChartProps } from '#shared/charts/ports/chart.port';

import {
  CHART_MARGIN_COMPACT,
  DEFAULT_CHART_HEIGHT,
  LEGEND_BOTTOM_ROW,
  PIE_CORNER_RADIUS,
  PIE_INNER_RADIUS,
  PIE_PAD_ANGLE,
} from '#shared/charts/adapters/nivo/nivo-defaults';

export const NivoPieChart = ({
  data,
  height = DEFAULT_CHART_HEIGHT,
  colors,
  showLegend,
}: PieChartProps): React.JSX.Element => {
  const pieData = data.map((d) => ({
    id: d.label,
    label: d.label,
    value: d.value,
  }));

  return (
    <div style={{ height }}>
      <ResponsivePie
        data={pieData}
        margin={CHART_MARGIN_COMPACT}
        innerRadius={PIE_INNER_RADIUS}
        padAngle={PIE_PAD_ANGLE}
        cornerRadius={PIE_CORNER_RADIUS}
        colors={colors}
        legends={showLegend ? [LEGEND_BOTTOM_ROW] : []}
      />
    </div>
  );
};
