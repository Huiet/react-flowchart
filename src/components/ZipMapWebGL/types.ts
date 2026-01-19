export interface ZipDataPoint {
  zipCode: string;
  value: number;
}

export interface ZipMapWebGLProps {
  data: ZipDataPoint[];
  width?: number;
  height?: number;
}

export interface Transform {
  x: number;
  y: number;
  scale: number;
}

export interface ZipGeometry {
  zipCode: string;
  geometry: any;
  value: number;
}

export interface ThreeDigitGeometry {
  prefix: string;
  geometry: any;
  totalValue: number;
  zipCodes: string[];
}
