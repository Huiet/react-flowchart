export interface ZipDataPoint {
  zipCode: string;
  value: number;
}

export interface HeatMapProps {
  data: ZipDataPoint[];
  width?: number;
  height?: number;
  onSelect?: (zipCode: string | null) => void;
  selectedZip?: string | null;
  valueFormatter?: (value: number) => string;
}

export interface TooltipData {
  zipCode: string;
  value?: number;
  x: number;
  y: number;
}
