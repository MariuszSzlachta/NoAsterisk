import type { LineSvgLayer, LineCustomSvgLayerProps, LineSeries } from '@nivo/line';
import { ResponsiveLine } from '@nivo/line';

import type { LineChartProps } from '#shared/charts/ports/chart.port';
import { DEFAULT_CHART_HEIGHT } from '#shared/charts/adapters/nivo/nivo-defaults';

const CHART_MARGIN = { top: 12, right: 20, bottom: 44, left: 48 } as const;

const LEGEND_TOP_RIGHT = {
  anchor: 'top-right' as const,
  direction: 'row' as const,
  translateY: -12,
  itemWidth: 80,
  itemHeight: 20,
  symbolSize: 8,
  symbolShape: 'square' as const,
};

const formatAxisValue = (v: number): string => {
  if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
  return String(v);
};

const GradientDefs = (): React.JSX.Element => (
  <defs>
    <linearGradient id="areaGradient0" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="var(--income)" stopOpacity={0.18} />
      <stop offset="100%" stopColor="var(--income)" stopOpacity={0} />
    </linearGradient>
    <linearGradient id="areaGradient1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.16} />
      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
    </linearGradient>
  </defs>
);

const GradientAreaLayer = ({ series, xScale, yScale, innerHeight }: LineCustomSvgLayerProps<LineSeries>): React.JSX.Element => {
  return (
    <g>
      <GradientDefs />
      {series.map((s, i) => {
        const points = s.data
          .filter((d) => d.data.x !== null && d.data.y !== null)
          .map((d) => ({
            x: xScale(d.data.x as Parameters<typeof xScale>[0]),
            y: yScale(d.data.y as number),
          }));

        if (points.length === 0) return null;

        const first = points[0]!;
        const last = points[points.length - 1]!;
        const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
        const areaPath = `${linePath} L${last.x},${innerHeight} L${first.x},${innerHeight} Z`;

        return (
          <path
            key={s.id}
            d={areaPath}
            fill={`url(#areaGradient${i})`}
          />
        );
      })}
    </g>
  );
};

const LastPointLayer = ({ series, xScale, yScale }: LineCustomSvgLayerProps<LineSeries>): React.JSX.Element => {
  return (
    <g>
      {series.map((s) => {
        const last = s.data[s.data.length - 1];
        if (!last || last.data.x === null || last.data.y === null) return null;
        return (
          <circle
            key={s.id}
            cx={xScale(last.data.x as Parameters<typeof xScale>[0])}
            cy={yScale(last.data.y as number)}
            r={3.5}
            fill={s.color}
            stroke="var(--surface)"
            strokeWidth={2}
          />
        );
      })}
    </g>
  );
};

export const NivoLineChart = ({
  data,
  height = DEFAULT_CHART_HEIGHT,
  colors,
  showLegend,
  showGrid = true,
  axisBottom,
  axisLeft,
}: LineChartProps): React.JSX.Element => {
  const layers: LineSvgLayer<LineSeries>[] = [
    'grid', 'axes', GradientAreaLayer, 'lines', LastPointLayer, 'crosshair', 'slices',
  ];

  return (
    <div style={{ height }}>
      <ResponsiveLine
        data={data}
        margin={CHART_MARGIN}
        xScale={{ type: 'point' }}
        yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
        curve="linear"
        enableGridX={false}
        enableGridY={showGrid}
        enableArea={false}
        colors={colors}
        lineWidth={2.2}
        pointSize={0}
        enablePointLabel={false}
        layers={layers}
        axisBottom={axisBottom ? { legend: axisBottom.label } : { tickPadding: 10 }}
        axisLeft={axisLeft ? { legend: axisLeft.label } : { tickPadding: 10, format: formatAxisValue }}
        theme={{
          grid: { line: { stroke: 'var(--border)', strokeWidth: 1 } },
          axis: {
            ticks: { text: { fill: 'var(--fg-subtle)', fontSize: 10, fontFamily: "'Geist Mono', monospace" } },
          },
          crosshair: { line: { stroke: 'var(--fg-subtle)', strokeWidth: 1 } },
          legends: { text: { fill: 'var(--fg-muted)', fontSize: 12, fontFamily: "'Geist', sans-serif" } },
        }}
        legends={showLegend ? [LEGEND_TOP_RIGHT] : []}
      />
    </div>
  );
};
