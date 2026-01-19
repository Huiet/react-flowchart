import classes from './CardValue.module.scss';
import { Text } from '@mantine/core';
import { CardValueProps } from '../types';

export function CardValue({ children, className }: CardValueProps) {
  return (
    <Text className={`${classes.value} ${className || ''}`} size="xl" fw={700}>
      {children}
    </Text>
  );
}
