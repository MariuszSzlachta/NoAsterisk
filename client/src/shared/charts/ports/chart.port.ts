export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface ChartSeriesDataPoint {
  x: string | number;
  y: number;
}

export interface ChartSeries {
  id: string;
  data: ChartSeriesDataPoint[];
}

export type ChartType = 'line' | 'bar' | 'pie';

interface ChartBaseProps {
  height?: number;
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  axisBottom?: { label: string };
  axisLeft?: { label: string };
}

export interface LineChartProps extends ChartBaseProps {
  type: 'line';
  data: ChartSeries[];
}

export interface BarChartProps extends ChartBaseProps {
  type: 'bar';
  data: ChartDataPoint[];
}

export interface PieChartProps extends ChartBaseProps {
  type: 'pie';
  data: ChartDataPoint[];
}

export type ChartProps = LineChartProps | BarChartProps | PieChartProps;
