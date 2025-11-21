export interface MetricData {
  label: string;
  value: number;
  percentage: number;
  color: string;
  status: 'initial' | 'active' | 'completed';
}

export interface ApplicationTrackingChartProps {
  data: MetricData[];
  title?: string;
  subtitle?: string;
  isLoading?: boolean;
}
