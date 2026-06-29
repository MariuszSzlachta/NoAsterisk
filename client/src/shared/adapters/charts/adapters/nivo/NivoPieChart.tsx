import {
  ResponsivePie,
  type ComputedDatum,
  type PieCustomLayerProps,
} from '@nivo/pie';

import {
  COLOR_FG,
  COLOR_FG_MUTED,
  COLOR_FG_SUBTLE,
  DEFAULT_CHART_HEIGHT,
  FONT_SANS,
  FONT_SIZE_LG,
  FONT_SIZE_MD,
  FONT_SIZE_XS,
} from '#shared/adapters/charts/adapters/nivo/nivo-defaults';
import type { PieChartProps } from '#shared/adapters/charts/ports/chart.port';

const DONUT_INNER_RADIUS = 0.65;
const MARGIN_WITH_LEGEND = {
  top: 10,
  right: 160,
  bottom: 10,
  left: 10,
} as const;
const MARGIN_NO_LEGEND = { top: 10, right: 10, bottom: 10, left: 10 } as const;

interface PieTooltipDatum {
  id: string;
  label: string;
  value: number;
}

const PieTooltip = ({
  datum,
}: {
  datum: ComputedDatum<PieTooltipDatum>;
}): React.JSX.Element => (
  <div className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm shadow-card">
    <span
      className="mr-2 inline-block h-2.5 w-2.5 rounded-sm"
      style={{ backgroundColor: datum.color }}
    />
    <span className="font-medium text-foreground">{datum.label}</span>
    <span className="ml-2 tabular-nums text-muted-foreground">
      {datum.value.toLocaleString('pl-PL')} zł
    </span>
  </div>
);

const LEGEND_RIGHT = {
  anchor: 'right' as const,
  direction: 'column' as const,
  translateX: 150,
  itemWidth: 140,
  itemHeight: 26,
  symbolSize: 10,
  symbolShape: 'square' as const,
};

interface CenterTextProps {
  total: number;
}

const createCenterLayer = ({ total }: CenterTextProps) => {
  const CenterText = ({
    centerX,
    centerY,
  }: PieCustomLayerProps<{
    id: string;
    label: string;
    value: number;
  }>): React.JSX.Element => (
    <g>
      <text
        x={centerX}
        y={centerY - 6}
        textAnchor="middle"
        style={{
          fontSize: FONT_SIZE_LG,
          fontWeight: 600,
          fontFamily: FONT_SANS,
          fill: COLOR_FG,
          letterSpacing: '-0.02em',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {total.toLocaleString('pl-PL')}
      </text>
      <text
        x={centerX}
        y={centerY + 14}
        textAnchor="middle"
        style={{
          fontSize: FONT_SIZE_XS,
          fill: COLOR_FG_SUBTLE,
          fontFamily: FONT_SANS,
        }}
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
    <div style={{ height, overflow: 'visible' }}>
      <ResponsivePie
        data={pieData}
        margin={showLegend ? MARGIN_WITH_LEGEND : MARGIN_NO_LEGEND}
        innerRadius={DONUT_INNER_RADIUS}
        padAngle={0}
        cornerRadius={0}
        colors={colors}
        enableArcLabels={false}
        enableArcLinkLabels={false}
        tooltip={PieTooltip}
        layers={['arcs', CenterLayer, 'legends']}
        theme={{
          legends: {
            text: {
              fill: COLOR_FG_MUTED,
              fontSize: FONT_SIZE_MD,
              fontFamily: FONT_SANS,
            },
          },
        }}
        legends={showLegend ? [LEGEND_RIGHT] : []}
      />
    </div>
  );
};
