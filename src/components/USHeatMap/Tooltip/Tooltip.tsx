import { TooltipData } from '../types';
import styles from './Tooltip.module.css';

interface TooltipProps {
  data: TooltipData;
  valueFormatter?: (value: number) => string;
}

export const Tooltip: React.FC<TooltipProps> = ({ data, valueFormatter = (v) => v.toLocaleString() }) => (
  <div className={styles.tooltip} style={{ left: data.x + 10, top: data.y - 10 }}>
    <div className={styles.title}>Zip: {data.zipCode}</div>
    {data.value !== undefined && <div className={styles.value}>Value: {valueFormatter(data.value)}</div>}
  </div>
);
