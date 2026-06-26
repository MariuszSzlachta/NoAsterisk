import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import type { ChartProps, LineChartProps, BarChartProps, PieChartProps } from '../../ports/chart.port';

function renderLineChart(props: LineChartProps): React.JSX.Element {
  return (
    <ResponsiveLine
      data={props.data}
      margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
      xScale={{ type: 'point' }}
      yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
      enableGridX={props.showGrid ?? true}
      enableGridY={props.showGrid ?? true}
      colors={props.colors}
      axisBottom={props.axisBottom ? { legend: props.axisBottom.label } : undefined}
      axisLeft={props.axisLeft ? { legend: props.axisLeft.label } : undefined}
      legends={props.showLegend ? [{ anchor: 'bottom-right' as const, direction: 'column' as const, translateX: 100, itemWidth: 80, itemHeight: 20 }] : []}
    />
  );
}

function renderBarChart(props: BarChartProps): React.JSX.Element {
  const barData = props.data.map((d) => ({ id: d.label, value: d.value }));
  return (
    <ResponsiveBar
      data={barData}
      keys={['value']}
      indexBy="id"
      margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
      enableGridY={props.showGrid ?? true}
      colors={props.colors}
      axisBottom={props.axisBottom ? { legend: props.axisBottom.label } : undefined}
      axisLeft={props.axisLeft ? { legend: props.axisLeft.label } : undefined}
      legends={props.showLegend ? [{ anchor: 'bottom-right' as const, direction: 'column' as const, translateX: 100, itemWidth: 80, itemHeight: 20, dataFrom: 'keys' as const }] : []}
    />
  );
}

function renderPieChart(props: PieChartProps): React.JSX.Element {
  const pieData = props.data.map((d) => ({ id: d.label, label: d.label, value: d.value }));
  return (
    <ResponsivePie
      data={pieData}
      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
      innerRadius={0.5}
      padAngle={0.7}
      cornerRadius={3}
      colors={props.colors}
      legends={props.showLegend ? [{ anchor: 'bottom' as const, direction: 'row' as const, translateY: 56, itemWidth: 100, itemHeight: 18 }] : []}
    />
  );
}

export function NivoChartAdapter(props: ChartProps): React.JSX.Element {
  const { height = 300 } = props;

  const content = (): React.JSX.Element => {
    switch (props.type) {
      case 'line': return renderLineChart(props);
      case 'bar': return renderBarChart(props);
      case 'pie': return renderPieChart(props);
    }
  };

  return <div style={{ height }}>{content()}</div>;
}
