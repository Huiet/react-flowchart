import { Text } from '@mantine/core';
import { CardLabelProps } from '../types';
import classes from './CardLabel.module.scss';

export function CardLabel({ children, className }: CardLabelProps) {
  return (
    <Text className={`${classes.label} ${className || ''}`} size="sm" c="dimmed" fw={500}>
      {children}
    </Text>
  );
}
