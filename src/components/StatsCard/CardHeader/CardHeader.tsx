import { Group } from '@mantine/core';
import { CardLabel } from '../CardLabel/CardLabel';
import { CardHeaderProps } from '../types';
import classes from './CardHeader.module.scss';

export function CardHeader({ label, icon, className }: CardHeaderProps) {
  return (
    <Group justify="space-between" className={`${classes.header} ${className || ''}`}>
      <CardLabel>{label}</CardLabel>
      {icon && <div className={classes.icon}>{icon}</div>}
    </Group>
  );
}
