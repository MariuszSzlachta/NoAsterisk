import {
  ResponsiveLine,
  type LineCustomSvgLayerProps,
  type LineSeries,
  type LineSvgLayer,
} from '@nivo/line';

import { computeYTickValues, formatAxisValue } from '#shared/adapters/charts/adapters/nivo/utils/axis';
import {
  COLOR_BORDER,
  COLOR_FG_MUTED,
  COLOR_FG_SUBTLE,
  COLOR_SURFACE,
  DEFAULT_CHART_HEIGHT,
  FONT_FEATURE_SETTINGS,
  FONT_SANS,
  FONT_SIZE_MD,
  FONT_SIZE_XS,
  LETTER_SPACING_TIGHT,
} from '#shared/adapters/charts/adapters/nivo/nivo-defaults';
import type { LineChartProps } from '#shared/adapters/charts/ports/chart.port';

const CHART_MARGIN = { top: 12, right: 20, bottom: 44, left: 48 } as const;
const CHART_MARGIN_WITH_LEGEND = { top: 30, right: 20, bottom: 44, left: 48 } as const;

const LEGEND_TOP_RIGHT = {
  anchor: 'top-right' as const,
  direction: 'row' as const,
  translateY: -12,
  itemWidth: 80,
  itemHeight: 20,
  symbolSize: 8,
  symbolShape: 'square' as const,
};



const GradientAreaLayer = ({
  series,
  xScale,
  yScale,
  innerHeight,
}: LineCustomSvgLayerProps<LineSeries>): React.JSX.Element => {
  return (
    <g>
      <defs>
        {series.map((s, i) => (
          <linearGradient key={s.id} id={`areaGradient${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s.color} stopOpacity={0.18} />
            <stop offset="100%" stopColor={s.color} stopOpacity={0} />
          </linearGradient>
        ))}
      </defs>
      {series.map((s, i) => {
        const points = s.data
          .filter((d) => d.data.x !== null && d.data.y !== null)
          .map((d) => ({
            x: xScale(d.data.x as Parameters<typeof xScale>[0]),
            y: yScale(d.data.y as number),
          }));

        if (points.length === 0) {
          return null;
        }

        const first = points[0]!;
        const last = points[points.length - 1]!;
        const linePath = points
          .map((p, idx) => `${idx === 0 ? 'M' : 'L'}${p.x},${p.y}`)
          .join(' ');
        const areaPath = `${linePath} L${last.x},${innerHeight} L${first.x},${innerHeight} Z`;

        return <path key={s.id} d={areaPath} fill={`url(#areaGradient${i})`} />;
      })}
    </g>
  );
};

const LastPointLayer = ({
  series,
  xScale,
  yScale,
}: LineCustomSvgLayerProps<LineSeries>): React.JSX.Element => {
  return (
    <g>
      {series.map((s) => {
        const last = s.data[s.data.length - 1];
        if (!last || last.data.x === null || last.data.y === null) {
          return null;
        }
        return (
          <circle
            key={s.id}
            cx={xScale(last.data.x as Parameters<typeof xScale>[0])}
            cy={yScale(last.data.y as number)}
            r={3.5}
            fill={s.color}
            stroke={COLOR_SURFACE}
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
    'grid',
    'axes',
    GradientAreaLayer,
    'lines',
    LastPointLayer,
    'crosshair',
    'slices',
    'legends',
  ];

  return (
    <div style={{ height }}>
      <ResponsiveLine
        data={data}
        margin={showLegend ? CHART_MARGIN_WITH_LEGEND : CHART_MARGIN}
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
        axisBottom={
          axisBottom ? { legend: axisBottom.label } : { tickPadding: 10 }
        }
        axisLeft={
          axisLeft
            ? {
                legend: axisLeft.label,
                legendOffset: -40,
                legendPosition: 'middle' as const,
                tickPadding: 10,
                tickValues: axisLeft.tickValues ?? computeYTickValues(data),
                format: formatAxisValue,
              }
            : {
                tickPadding: 10,
                tickValues: computeYTickValues(data),
                format: formatAxisValue,
              }
        }
        theme={{
          grid: { line: { stroke: COLOR_BORDER, strokeWidth: 1 } },
          axis: {
            ticks: {
              text: {
                fill: COLOR_FG_SUBTLE,
                fontSize: FONT_SIZE_XS,
                fontFamily: FONT_SANS,
                fontFeatureSettings: FONT_FEATURE_SETTINGS,
                letterSpacing: LETTER_SPACING_TIGHT,
              },
            },
          },
          crosshair: { line: { stroke: COLOR_FG_SUBTLE, strokeWidth: 1 } },
          legends: {
            text: {
              fill: COLOR_FG_MUTED,
              fontSize: FONT_SIZE_MD,
              fontFamily: FONT_SANS,
            },
          },
        }}
        legends={showLegend ? [LEGEND_TOP_RIGHT] : []}
      />
    </div>
  );
};
