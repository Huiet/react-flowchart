export interface BarDataPoint {
  category: string; // X-axis category (e.g., "Nov 1 - Nov 2")
  values: Record<string, number>; // Key-value pairs for each bar in the group
}

export interface BarSeries {
  key: string; // Unique identifier for this series
  label: string; // Display name for the legend
  color: string; // Bar color
}

export interface ChartMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface D3BarChartProps {
  data: BarDataPoint[]; // Array of data points
  series: BarSeries[]; // Series definitions
  width?: number; // Optional fixed width (omit for responsive)
  height?: number; // Optional fixed height (omit for responsive)
  margins?: ChartMargins;
  showValues?: boolean; // Show value labels on top of bars
  showLegend?: boolean; // Show legend
  valueFormatter?: (value: number) => string; // Custom value formatter
  yAxisLabel?: string; // Y-axis label
  xAxisLabel?: string; // X-axis label
  isLoading?: boolean; // Show loading animation
}
