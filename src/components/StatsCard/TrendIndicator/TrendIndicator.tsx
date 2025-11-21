import { Group, Text } from '@mantine/core';
import {
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
  IconArrowUp,
  IconArrowDown,
} from '@tabler/icons-react';
import { TrendIndicatorProps, TrendType } from '../types';
import classes from './TrendIndicator.module.scss';

function getTrendConfig(type?: TrendType) {
  switch (type) {
    case 'positive':
      return {
        color: 'teal',
        TrendIcon: IconTrendingUp,
        ArrowIcon: IconArrowUp,
      };
    case 'negative':
      return {
        color: 'red',
        TrendIcon: IconTrendingDown,
        ArrowIcon: IconArrowDown,
      };
    case 'neutral':
    default:
      return {
        color: 'gray',
        TrendIcon: IconMinus,
        ArrowIcon: IconMinus,
      };
  }
}

export function TrendIndicator({ trend, className }: TrendIndicatorProps) {
  const { color, TrendIcon, ArrowIcon } = getTrendConfig(trend.type);

  return (
    <Group gap={4} className={`${classes.trendIndicator} ${className || ''}`}>
      <TrendIcon size={16} stroke={2} className={classes[color]} />
      <Text size="sm" c={color} fw={600}>
        {trend.value}%
      </Text>
      <ArrowIcon size={14} stroke={2} className={classes[color]} />
      {trend.label && (
        <Text size="xs" c="dimmed">
          {trend.label}
        </Text>
      )}
    </Group>
  );
}
