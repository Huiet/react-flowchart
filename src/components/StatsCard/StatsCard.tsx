import { Card } from '@mantine/core';
import { CardHeader } from './CardHeader/CardHeader';
import { CardMetric } from './CardMetric/CardMetric';
import { CardFooter } from './CardFooter/CardFooter';
import { StatsCardProps } from './types';
import classes from './StatsCard.module.scss';

export function StatsCard({ label, value, trend, icon, footer, className }: StatsCardProps) {
  return (
    <Card withBorder padding="lg" radius="md" className={`${classes.card} ${className || ''}`}>
      <CardHeader label={label} icon={icon} />
      <CardMetric value={value} trend={trend} />
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
}
