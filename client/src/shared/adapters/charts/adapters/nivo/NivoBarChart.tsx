import { ResponsiveBar } from '@nivo/bar';

import type { BarChartProps } from '#shared/adapters/charts/ports/chart.port';
import { DEFAULT_CHART_HEIGHT } from '#shared/adapters/charts/adapters/nivo/nivo-defaults';

const MARGIN = { top: 10, right: 60, bottom: 10, left: 120 } as const;

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
        labelTextColor="var(--fg-muted)"
        axisLeft={{
          tickPadding: 8,
        }}
        axisBottom={null}
        theme={{
          axis: {
            ticks: { text: { fill: 'var(--fg-muted)', fontSize: 12, fontFamily: "Geist, -apple-system, sans-serif" } },
          },
          labels: { text: { fontSize: 11, fontFamily: "Geist Mono, monospace", fill: 'var(--fg)' } },
        }}
      />
    </div>
  );
};
