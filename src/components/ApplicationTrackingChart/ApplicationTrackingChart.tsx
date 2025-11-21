import { useEffect, useRef, useState } from 'react';
import { IconChevronRight } from '@tabler/icons-react';
import styles from './ApplicationTrackingChart.module.scss';
import { ApplicationTrackingChartProps } from './types';

export const ApplicationTrackingChart = ({
  data,
  title = 'Activities Overview',
  subtitle = 'Application Tracking',
  isLoading = false,
}: ApplicationTrackingChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Calculate circle size based on container width and index (progressive sizing)
  const calculateCircleSize = (index: number) => {
    if (containerWidth === 0) return 100 - (index * 8); // Default progressive sizing

    // Space needed per metric (circle + arrow + padding)
    const spacePerMetric = 180;
    const minCircleSize = 60;
    const maxCircleSize = 120;

    let baseSize = maxCircleSize;

    // If all metrics fit in one row
    if (containerWidth >= spacePerMetric * data.length) {
      // Scale circle size based on available width
      const availablePerMetric = containerWidth / data.length;
      baseSize = Math.min(availablePerMetric * 0.4, maxCircleSize);
      baseSize = Math.max(baseSize, minCircleSize);
    } else {
      // If wrapping is needed, use a responsive size
      const metricsPerRow = Math.floor(containerWidth / spacePerMetric) || 1;
      const availablePerMetric = containerWidth / metricsPerRow;
      baseSize = Math.min(availablePerMetric * 0.4, maxCircleSize);
      baseSize = Math.max(baseSize, minCircleSize);
    }

    // Progressive sizing: each circle gets smaller
    const sizeReduction = (baseSize * 0.08) * index; // 8% reduction per step
    return Math.max(baseSize - sizeReduction, minCircleSize);
  };

  const strokeWidth = 4;

  // Calculate largest circle size for wrapping detection
  const largestCircleSize = calculateCircleSize(0);

  // Determine if metrics should wrap
  const spacePerMetric = largestCircleSize + 100;
  const shouldWrap = containerWidth < spacePerMetric * data.length && containerWidth > 0;

  return (
    <div className={styles.container} ref={containerRef}>
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner} />
        </div>
      )}

      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>

      <div className={styles.metricsContainer}>
        <div
          className={styles.metricsWrapper}
          style={{
            justifyContent: shouldWrap ? 'flex-start' : 'center',
            gap: shouldWrap ? '40px 60px' : '20px'
          }}
        >
          {data.map((metric, index) => {
            const circleSize = calculateCircleSize(index);
            const radius = circleSize / 2;

            return (
              <div key={metric.label} className={styles.metricGroup}>
                <div className={styles.metricItem}>
                  <div className={styles.circleWrapper}>
                    <svg
                      width={circleSize}
                      height={circleSize}
                      className={styles.circle}
                    >
                      <circle
                        cx={radius}
                        cy={radius}
                        r={radius - strokeWidth / 2}
                        fill="none"
                        stroke={metric.color}
                        strokeWidth={strokeWidth}
                        className={styles.circleStroke}
                      />
                      <text
                        x={radius}
                        y={radius}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className={styles.valueText}
                        style={{ fontSize: `${circleSize * 0.25}px` }}
                      >
                        {metric.value.toLocaleString()}
                      </text>
                    </svg>
                  </div>

                  <div className={styles.labelContainer}>
                    <div className={styles.label}>{metric.label}</div>
                    <div className={styles.percentage}>{metric.percentage}%</div>
                  </div>
                </div>

                {index < data.length - 1 && !shouldWrap && (
                  <div className={styles.arrowContainer}>
                    <IconChevronRight
                      size={28}
                      stroke={1.5}
                      color="#cbd5e0"
                      className={styles.arrow}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
