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

export interface TechnicalIndicators {
  sma20?: boolean;
  sma50?: boolean;
  sma200?: boolean;
  ema20?: boolean;
  ema50?: boolean;
  bollingerBands?: boolean;
}

export interface IndicatorDataPoint {
  date: Date;
  value: number;
}

export interface BollingerBandsData {
  date: Date;
  middle: number;
  upper: number;
  lower: number;
}

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
  enabledIndicators?: Record<string, TechnicalIndicators>; // Changed to per-line indicators
}
