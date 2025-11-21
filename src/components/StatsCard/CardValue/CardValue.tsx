import { Text } from '@mantine/core';
import { CardValueProps } from '../types';
import classes from './CardValue.module.scss';

export function CardValue({ children, className }: CardValueProps) {
  return (
    <Text className={`${classes.value} ${className || ''}`} size="xl" fw={700}>
      {children}
    </Text>
  );
}
