export interface DataPoint {
  date: Date;
  values: Record<string, number>; // Generic key-value pairs for any series
}

export interface Series {
  key: string; // Data key (e.g., 'imo', 'bank')
  label: string; // Display label (e.g., 'IMO', 'Bank')
  color: string; // Color for this series
}

export interface ChartMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface MetricsSummary {
  newCount: number;
  returnCount: number;
}

export interface TooltipData {
  date: Date;
  values: Array<{ key: string; label: string; value: number; color: string }>;
  x: number;
  y: number;
}

export interface HoverData {
  date: Date;
  values: Record<string, number>;
  total: number;
}

export interface UsersChartProps {
  data: DataPoint[];
  series: Series[];
  width?: number;
  height?: number;
  margins?: ChartMargins;
  showLegend?: boolean;
  isLoading?: boolean;
  metricsSummary?: MetricsSummary;
  newLabel?: string;
  returnLabel?: string;
}
