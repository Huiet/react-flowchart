import { useEffect, useRef, useState } from 'react';
import styles from './ApplicationTrackingChart.module.scss';
import { IconChevronRight } from '@tabler/icons-react';
import { ApplicationTrackingChartProps } from './types';

// Static color palette for circles (status progression: gray -> blue shades -> green)
const CIRCLE_COLORS = [
  '#374151', // Gray - Initial state
  '#3b82f6', // Blue - Active state 1
  '#2563eb', // Darker blue - Active state 2
  '#60a5fa', // Lighter blue - Active state 3
  '#10b981', // Green - Completed state
];

export const ApplicationTrackingChart = ({
  data,
  title = 'Activities Overview',
  subtitle = 'Application Tracking',
  isLoading = false,
}: ApplicationTrackingChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const metricsContainerRef = useRef<HTMLDivElement>(null);
  const metricsWrapperRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [itemPositions, setItemPositions] = useState<number[]>([]);

  // Observe the metricsContainer width (the container query element)
  useEffect(() => {
    if (!metricsContainerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(metricsContainerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Track vertical positions of metric items to detect line wrapping
  useEffect(() => {
    if (!metricsWrapperRef.current || containerWidth === 0) return;

    const updatePositions = () => {
      const metricItems = metricsWrapperRef.current?.querySelectorAll(`.${styles.metricItem}`);
      if (!metricItems) return;

      const positions: number[] = [];
      metricItems.forEach((item) => {
        const rect = item.getBoundingClientRect();
        positions.push(rect.top);
      });
      setItemPositions(positions);
    };

    // Use requestAnimationFrame to ensure layout is complete
    requestAnimationFrame(updatePositions);

    // Small delay to ensure flexbox has settled
    const timeout = setTimeout(updatePositions, 50);
    return () => clearTimeout(timeout);
  }, [containerWidth, data.length]);

  // Fixed circle sizes - progressively smaller left to right
  const getCircleSize = (index: number) => {
    const baseSizes = [120, 110, 100, 92, 84]; // Fixed sizes for each position
    return baseSizes[index] || 84; // Default to smallest if more than 5 items
  };

  const strokeWidth = 4;

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

      <div ref={metricsContainerRef} className={styles.metricsContainer}>
        <div
          ref={metricsWrapperRef}
          className={styles.metricsWrapper}
          style={{
            justifyContent: 'center',
          }}
        >
          {data.map((metric, index) => {
            const circleSize = getCircleSize(index);
            const radius = circleSize / 2;
            const circleColor = CIRCLE_COLORS[index] || CIRCLE_COLORS[CIRCLE_COLORS.length - 1]; // Use index for color, fallback to last color

            // Determine if this item and the next are on the same line
            const currentLineTop = itemPositions[index];
            const nextLineTop = itemPositions[index + 1];
            const isNextItemOnNewLine =
              nextLineTop !== undefined && Math.abs(nextLineTop - currentLineTop) > 5; // 5px threshold for line detection
            const shouldShowArrow = index < data.length - 1 && !isNextItemOnNewLine;

            return (
              <div key={metric.label} className={styles.metricGroup}>
                <div className={styles.metricItem}>
                  <div className={styles.circleWrapper}>
                    <svg width={circleSize} height={circleSize} className={styles.circle}>
                      <circle
                        cx={radius}
                        cy={radius}
                        r={radius - strokeWidth / 2}
                        fill="none"
                        stroke={circleColor}
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

                {shouldShowArrow && (
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
