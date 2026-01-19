import { useMemo } from 'react';
import styles from './LoadingAnimation.module.scss';
import { ChartType } from '../types';

interface LoadingAnimationProps {
  chartType: ChartType;
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ chartType }) => {
  const slices = useMemo(() => {
    const colors = ['#2563eb', '#dc2626', '#16a34a', '#ea580c', '#9333ea', '#0891b2'];
    const numSlices = 6;
    const anglePerSlice = 360 / numSlices;

    return Array.from({ length: numSlices }, (_, i) => ({
      id: i,
      color: colors[i],
      startAngle: i * anglePerSlice,
      endAngle: (i + 1) * anglePerSlice,
    }));
  }, []);

  const createSlicePath = (startAngle: number, endAngle: number, isDonut: boolean) => {
    const radius = 70;
    const innerRadius = isDonut ? 42 : 0;

    const startRadians = (startAngle - 90) * (Math.PI / 180);
    const endRadians = (endAngle - 90) * (Math.PI / 180);

    const x1 = 70 + radius * Math.cos(startRadians);
    const y1 = 70 + radius * Math.sin(startRadians);
    const x2 = 70 + radius * Math.cos(endRadians);
    const y2 = 70 + radius * Math.sin(endRadians);

    if (isDonut) {
      const x3 = 70 + innerRadius * Math.cos(endRadians);
      const y3 = 70 + innerRadius * Math.sin(endRadians);
      const x4 = 70 + innerRadius * Math.cos(startRadians);
      const y4 = 70 + innerRadius * Math.sin(startRadians);

      return `
        M ${x1} ${y1}
        A ${radius} ${radius} 0 0 1 ${x2} ${y2}
        L ${x3} ${y3}
        A ${innerRadius} ${innerRadius} 0 0 0 ${x4} ${y4}
        Z
      `;
    } else {
      return `
        M 70 70
        L ${x1} ${y1}
        A ${radius} ${radius} 0 0 1 ${x2} ${y2}
        Z
      `;
    }
  };

  return (
    <div className={styles.loadingContainer}>
      <div className={styles.contentWrapper}>
        <svg className={styles.spinner} viewBox="0 0 140 140">
          {slices.map((slice, index) => (
            <path
              key={slice.id}
              className={`${styles.slice} ${styles[`slice${index + 1}` as keyof typeof styles]} ${chartType === 'donut' ? styles.donutSlice : ''}`}
              d={createSlicePath(slice.startAngle, slice.endAngle, chartType === 'donut')}
              fill={slice.color}
              stroke="white"
              strokeWidth="2"
            />
          ))}
        </svg>
        <div className={styles.loadingText}>Loading chart...</div>
      </div>
    </div>
  );
};
