export type {
  ChartDataPoint,
  ChartSeries,
  ChartSeriesDataPoint,
  LineChartProps,
  BarChartProps,
  PieChartProps,
} from '#shared/adapters/charts/ports/chart.port';
import { NivoBarChart } from '#shared/adapters/charts/adapters/nivo/NivoBarChart';
import { NivoLineChart } from '#shared/adapters/charts/adapters/nivo/NivoLineChart';
import { NivoPieChart } from '#shared/adapters/charts/adapters/nivo/NivoPieChart';

export const LineChart = NivoLineChart;
export const BarChart = NivoBarChart;
export const PieChart = NivoPieChart;
