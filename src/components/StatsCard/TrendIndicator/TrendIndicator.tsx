import classes from './TrendIndicator.module.scss';
import {
  IconArrowDown,
  IconArrowUp,
  IconMinus,
  IconTrendingDown,
  IconTrendingUp,
} from '@tabler/icons-react';
import { Group, Text } from '@mantine/core';
import { TrendIndicatorProps, TrendType } from '../types';

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
