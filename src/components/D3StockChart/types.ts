export interface StockDataPoint {
  date: Date;
  value: number;
}

export interface StockLine {
  id: string;
  name: string;
  data: StockDataPoint[];
  color: string;
  visible: boolean;
}

export interface CustomAnnotation {
  id: string;
  date: Date;
  value: number;
  label: string;
  color: string;
  dotSize?: number;
}

export interface ReferenceLine {
  id: string;
  type: 'horizontal' | 'vertical';
  value: number | Date; // number for horizontal (y-axis), Date for vertical (x-axis)
  label: string;
  color?: string;
  strokeDashArray?: string;
}

export interface ChartMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export type DateRange = '1W' | '1M' | '3M' | 'YTD' | '1Y' | '5Y' | 'ALL';

export interface D3StockChartProps {
  lines: StockLine[];
  width?: number;
  height?: number;
  margins?: ChartMargins;
  showMinMaxAnnotations?: boolean;
  customAnnotations?: CustomAnnotation[];
  referenceLines?: ReferenceLine[];
  onLineToggle?: (lineId: string, visible: boolean) => void;
  defaultDateRange?: DateRange;
}
