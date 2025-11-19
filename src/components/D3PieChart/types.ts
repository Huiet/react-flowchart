export interface PieChartDataPoint {
  count: number;
  value: number;
  label: string;
}

export type ChartType = 'pie' | 'donut';

export interface D3PieChartProps {
  data: PieChartDataPoint[];
  width?: number;
  height?: number;
  chartType?: ChartType;
  showLegend?: boolean;
  showLabels?: boolean;
  isLoading?: boolean;
  colorScheme?: string[];
}
