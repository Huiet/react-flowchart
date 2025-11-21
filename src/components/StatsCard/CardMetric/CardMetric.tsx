import { Group } from '@mantine/core';
import { CardValue } from '../CardValue/CardValue';
import { TrendIndicator } from '../TrendIndicator/TrendIndicator';
import { CardMetricProps } from '../types';
import classes from './CardMetric.module.scss';

export function CardMetric({ value, trend, className }: CardMetricProps) {
  return (
    <Group gap="md" align="center" className={`${classes.metric} ${className || ''}`}>
      <CardValue>{value}</CardValue>
      {trend && <TrendIndicator trend={trend} />}
    </Group>
  );
}
