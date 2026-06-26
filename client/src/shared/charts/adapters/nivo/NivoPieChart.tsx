import type { PieCustomLayerProps } from '@nivo/pie';
import { ResponsivePie } from '@nivo/pie';

import type { PieChartProps } from '#shared/charts/ports/chart.port';
import { DEFAULT_CHART_HEIGHT } from '#shared/charts/adapters/nivo/nivo-defaults';

const DONUT_INNER_RADIUS = 0.65;
const MARGIN = { top: 10, right: 140, bottom: 10, left: 10 } as const;

const LEGEND_RIGHT = {
  anchor: 'right' as const,
  direction: 'column' as const,
  translateX: 130,
  itemWidth: 120,
  itemHeight: 24,
  symbolSize: 8,
  symbolShape: 'square' as const,
};

interface CenterTextProps {
  total: number;
}

const createCenterLayer = ({ total }: CenterTextProps) => {
  const CenterText = ({ centerX, centerY }: PieCustomLayerProps<{ id: string; label: string; value: number }>): React.JSX.Element => (
    <g>
      <text
        x={centerX}
        y={centerY - 6}
        textAnchor="middle"
        style={{ fontSize: 17, fontWeight: 600, fontFamily: "Geist, -apple-system, sans-serif", fill: 'var(--fg)', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}
      >
        {total.toLocaleString('pl-PL')}
      </text>
      <text
        x={centerX}
        y={centerY + 14}
        textAnchor="middle"
        style={{ fontSize: 10, fill: 'var(--fg-subtle)', fontFamily: "Geist, -apple-system, sans-serif" }}
      >
        zł / mies.
      </text>
    </g>
  );
  return CenterText;
};

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

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const CenterLayer = createCenterLayer({ total });

  return (
    <div style={{ height }}>
      <ResponsivePie
        data={pieData}
        margin={MARGIN}
        innerRadius={DONUT_INNER_RADIUS}
        padAngle={0}
        cornerRadius={0}
        colors={colors}
        enableArcLabels={false}
        enableArcLinkLabels={false}
        layers={['arcs', CenterLayer]}
        theme={{
          legends: { text: { fill: 'var(--fg-muted)', fontSize: 12, fontFamily: "'Geist', sans-serif" } },
        }}
        legends={showLegend ? [LEGEND_RIGHT] : []}
      />
    </div>
  );
};
