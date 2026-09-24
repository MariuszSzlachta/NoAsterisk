import { useEffect, useState } from 'react';
import type { AxisTickProps } from '@nivo/axes';
import {
  ResponsiveLine,
  type LineCustomSvgLayerProps,
  type LineSeries,
  type LineSvgLayer,
} from '@nivo/line';

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
import {
  computeYTickValues,
  formatAxisValue,
} from '#shared/adapters/charts/adapters/nivo/utils/axis';
import type { LineChartProps } from '#shared/adapters/charts/ports/chart.port';

const CHART_MARGIN = { top: 12, right: 20, bottom: 44, left: 48 };
const CHART_MARGIN_WITH_LEGEND = {
  top: 30,
  right: 20,
  bottom: 44,
  left: 48,
};

const COMPACT_CHART_MARGIN_WITH_LEGEND = {
  top: 30,
  right: 8,
  bottom: 40,
  left: 28,
};

const COMPACT_CHART_MARGIN_WITHOUT_LEGEND = {
  top: 12,
  right: 20,
  bottom: 40,
  left: 48,
};

const toDominantBaseline = (
  value: string | number | undefined,
): React.SVGAttributes<SVGTextElement>['dominantBaseline'] => {
  const allowed = new Set(['auto', 'use-script', 'no-change', 'reset-size', 'ideographic', 'alphabetic', 'hanging', 'mathematical', 'central', 'middle', 'text-after-edge', 'text-before-edge']);
  if (typeof value !== 'string' || !allowed.has(value)) return 'auto';
  if (value === 'auto' || value === 'use-script' || value === 'no-change' || value === 'reset-size' || value === 'ideographic' || value === 'alphabetic' || value === 'hanging' || value === 'mathematical' || value === 'central' || value === 'middle' || value === 'text-after-edge' || value === 'text-before-edge') return value;
  return 'auto';
};

const toTextAnchor = (
  value: string | undefined,
): React.SVGAttributes<SVGTextElement>['textAnchor'] => {
  if (value === 'start' || value === 'middle' || value === 'end') return value;
  return 'start';
};

const LEGEND_TOP_RIGHT: import('@nivo/legends').LegendProps = {
  anchor: 'top-right',
  direction: 'row',
  translateY: -12,
  itemWidth: 80,
  itemHeight: 20,
  symbolSize: 8,
  symbolShape: 'square',
};

const LastXAxisTick = ({
  tickIndex,
  value,
  x,
  y,
  lineY,
  textX,
  textY,
  textBaseline,
  textAnchor,
  rotate,
  theme,
  lastTickIndex,
  lastTickOffset,
}: AxisTickProps<string | number> & {
  lastTickIndex: number;
  lastTickOffset: number;
}): React.JSX.Element => {
  const offset = tickIndex === lastTickIndex ? -lastTickOffset : 0;

  return (
    <g transform={`translate(${x}, ${y})`}>
      <line x1={0} x2={0} y1={0} y2={lineY} style={theme.line} />
      <text
        dominantBaseline={toDominantBaseline(textBaseline)}
        textAnchor={toTextAnchor(textAnchor)}
        transform={`translate(${textX + offset}, ${textY}) rotate(${rotate})`}
        style={theme.text}
      >
        {String(value)}
      </text>
    </g>
  );
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
          <linearGradient
            key={s.id}
            id={`areaGradient${i}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor={s.color} stopOpacity={0.18} />
            <stop offset="100%" stopColor={s.color} stopOpacity={0} />
          </linearGradient>
        ))}
      </defs>
      {series.map((s, i) => {
        const points = s.data
          .filter((d) => d.data.x !== null && d.data.y !== null)
          .map((d) => ({
            x: xScale(String(d.data.x)),
            y: yScale(Number(d.data.y)),
          }));

        if (points.length === 0) {
          return null;
        }

        const first = points[0];
        const last = points[points.length - 1];
        if (first === undefined || last === undefined) return null;
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
            cx={xScale(String(last.data.x))}
            cy={yScale(Number(last.data.y))}
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
  compactOnMobile = false,
  hideLegendOnMobile = false,
  xAxisLastTickOffset = 0,
  mobileXAxisLastTickOffset = 0,
  showLegend,
  showGrid = true,
  axisBottom,
  axisLeft,
}: LineChartProps): React.JSX.Element => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (!compactOnMobile) return;

    const mediaQuery = window.matchMedia('(max-width: 1023px)');
    const updateViewport = (): void => setIsMobile(mediaQuery.matches);
    updateViewport();
    mediaQuery.addEventListener('change', updateViewport);

    return () => mediaQuery.removeEventListener('change', updateViewport);
  }, [compactOnMobile]);

  const legend =
    isMobile && compactOnMobile
      ? { ...LEGEND_TOP_RIGHT, itemWidth: 96 }
      : LEGEND_TOP_RIGHT;
  const shouldShowLegend =
    showLegend && !(isMobile && compactOnMobile && hideLegendOnMobile);
  const chartMargin = shouldShowLegend
    ? isMobile && compactOnMobile
      ? COMPACT_CHART_MARGIN_WITH_LEGEND
      : CHART_MARGIN_WITH_LEGEND
    : isMobile && compactOnMobile
      ? COMPACT_CHART_MARGIN_WITHOUT_LEGEND
      : CHART_MARGIN;
  const bottomTickValues =
    axisBottom && isMobile && compactOnMobile
      ? (axisBottom.mobileTickValues ?? axisBottom.tickValues)
      : axisBottom?.tickValues;
  const lastTickOffset =
    isMobile && compactOnMobile
      ? mobileXAxisLastTickOffset
      : xAxisLastTickOffset;
  const bottomTick =
    lastTickOffset > 0 && bottomTickValues
      ? (props: AxisTickProps<string | number>) => (
          <LastXAxisTick
            {...props}
            lastTickIndex={bottomTickValues.length - 1}
            lastTickOffset={lastTickOffset}
          />
        )
      : undefined;

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
        margin={chartMargin}
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
          axisBottom
            ? {
                legend: axisBottom.label,
                tickPadding: 10,
                ...(bottomTickValues ? { tickValues: bottomTickValues } : {}),
                ...(bottomTick ? { renderTick: bottomTick } : {}),
              }
            : { tickPadding: 10 }
        }
        axisLeft={
          axisLeft
            ? {
                legend: axisLeft.label,
                legendOffset: -40,
                legendPosition: 'middle',
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
        legends={shouldShowLegend ? [legend] : []}
      />
    </div>
  );
};
