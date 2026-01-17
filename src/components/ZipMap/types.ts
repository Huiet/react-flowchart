export interface ZipDataPoint {
  zipCode: string;
  value: number;
}

export interface ZipMapProps {
  data: ZipDataPoint[];
  width?: number;
  height?: number;
}
