import { BLUE_SHADES } from '../colorScale';
import styles from './Legend.module.css';

interface LegendProps {
  thresholds: number[];
  valueFormatter?: (value: number) => string;
}

export const Legend: React.FC<LegendProps> = ({ thresholds, valueFormatter = (v) => v.toLocaleString() }) => {
  const labels = thresholds.length > 0
    ? [
        `< ${valueFormatter(thresholds[0])}`,
        ...thresholds.slice(0, -1).map((t, i) => `${valueFormatter(t)} - ${valueFormatter(thresholds[i + 1])}`),
        `> ${valueFormatter(thresholds[thresholds.length - 1])}`,
      ]
    : BLUE_SHADES.map((_, i) => `Level ${i + 1}`);

  return (
    <div className={styles.legend}>
      {BLUE_SHADES.map((color, i) => (
        <div key={i} className={styles.item}>
          <div className={styles.swatch} style={{ backgroundColor: color }} />
          <span className={styles.label}>{labels[i] || ''}</span>
        </div>
      ))}
    </div>
  );
};
