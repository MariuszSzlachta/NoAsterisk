import { ResponsiveBar } from '@nivo/bar';

import {
  COLOR_FG,
  COLOR_FG_MUTED,
  DEFAULT_CHART_HEIGHT,
  FONT_FEATURE_SETTINGS,
  FONT_MONO,
  FONT_SANS,
  FONT_SIZE_MD,
  FONT_SIZE_SM,
  LETTER_SPACING_TIGHT,
} from '#shared/adapters/charts/adapters/nivo/nivo-defaults';
import type { BarChartProps } from '#shared/adapters/charts/ports/chart.port';

const MARGIN = { top: 10, right: 60, bottom: 10, left: 120 };

export const NivoBarChart = ({
  data,
  height = DEFAULT_CHART_HEIGHT,
  colors,
  showGrid = false,
}: BarChartProps): React.JSX.Element => {
  const barData = [...data]
    .sort((a, b) => a.value - b.value)
    .map((d) => ({ id: d.label, label: d.label, value: d.value }));

  return (
    <div style={{ height }}>
      <ResponsiveBar
        data={barData}
        keys={['value']}
        indexBy="id"
        layout="horizontal"
        margin={MARGIN}
        enableGridX={showGrid}
        enableGridY={false}
        colors={colors}
        colorBy="indexValue"
        borderRadius={3}
        padding={0.3}
        enableLabel
        label={(d) => String(d.value)}
        labelSkipWidth={20}
        labelPosition="end"
        labelOffset={8}
        labelTextColor={COLOR_FG_MUTED}
        axisLeft={{
          tickPadding: 8,
        }}
        axisBottom={null}
        theme={{
          axis: {
            ticks: {
              text: {
                fill: COLOR_FG_MUTED,
                fontSize: FONT_SIZE_MD,
                fontFamily: FONT_SANS,
                fontFeatureSettings: FONT_FEATURE_SETTINGS,
                letterSpacing: LETTER_SPACING_TIGHT,
              },
            },
          },
          labels: {
            text: {
              fontSize: FONT_SIZE_SM,
              fontFamily: FONT_MONO,
              fill: COLOR_FG,
              fontFeatureSettings: FONT_FEATURE_SETTINGS,
              letterSpacing: LETTER_SPACING_TIGHT,
            },
          },
        }}
      />
    </div>
  );
};
