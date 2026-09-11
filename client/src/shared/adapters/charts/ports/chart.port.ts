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

interface ChartBaseProps {
  height?: number;
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  axisBottom?: {
    label: string;
    tickValues?: Array<string | number>;
    mobileTickValues?: Array<string | number>;
  };
  axisLeft?: { label: string; tickValues?: number | number[] };
}

export interface LineChartProps extends ChartBaseProps {
  data: ChartSeries[];
  compactOnMobile?: boolean;
  hideLegendOnMobile?: boolean;
  xAxisLastTickOffset?: number;
  mobileXAxisLastTickOffset?: number;
}

export interface BarChartProps extends ChartBaseProps {
  data: ChartDataPoint[];
}

export interface PieChartProps extends Omit<
  ChartBaseProps,
  'showGrid' | 'axisBottom' | 'axisLeft'
> {
  data: ChartDataPoint[];
}
