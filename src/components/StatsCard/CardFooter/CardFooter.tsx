import { Box } from '@mantine/core';
import { CardFooterProps } from '../types';
import classes from './CardFooter.module.scss';

export function CardFooter({ children, className }: CardFooterProps) {
  return <Box className={`${classes.footer} ${className || ''}`}>{children}</Box>;
}
