import { ReactNode } from 'react';

export type TrendType = 'positive' | 'negative' | 'neutral';

export interface TrendData {
  value: number;
  type?: TrendType;
  label?: string;
}

export interface CardLabelProps {
  children: ReactNode;
  className?: string;
}

export interface CardValueProps {
  children: ReactNode;
  className?: string;
}

export interface TrendIndicatorProps {
  trend: TrendData;
  className?: string;
}

export interface CardHeaderProps {
  label: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export interface CardMetricProps {
  value: ReactNode;
  trend?: TrendData;
  className?: string;
}

export interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export interface StatsCardProps {
  label: ReactNode;
  value: ReactNode;
  trend?: TrendData;
  icon?: ReactNode;
  footer?: ReactNode;
  className?: string;
}
