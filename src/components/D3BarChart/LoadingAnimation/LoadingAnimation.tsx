import { useEffect, useMemo, useState } from 'react';
import styles from './LoadingAnimation.module.scss';

// Animation duration constant (in ms)
// IMPORTANT: Must match CSS animation duration in LoadingAnimation.module.scss
const LOADING_ANIMATION_DURATION = 2500;

export const LoadingAnimation = () => {
  // Counter to regenerate bars on each animation loop
  const [loadingCounter, setLoadingCounter] = useState(0);

  // Set up timing for animation cycle - regenerate after animation completes
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingCounter((prev) => prev + 1);
    }, LOADING_ANIMATION_DURATION);

    return () => clearInterval(interval);
  }, []);

  // Generate random bar heights and colors
  const barData = useMemo(() => {
    const numBars = 8;
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f43f5e', '#6366f1'];

    return Array.from({ length: numBars }, (_, i) => {
      // Generate random height between 30% and 95%
      const height = 30 + Math.random() * 65;
      return {
        id: i,
        height,
        color: colors[i],
        delay: i * 0.08, // Stagger animation by 80ms per bar
      };
    });
  }, [loadingCounter]);

  return (
    <div className={styles.loadingOverlay}>
      <div className={styles.barChartContainer}>
        {/* Grid lines */}
        <div className={styles.gridLines}>
          <div className={styles.gridLine} />
          <div className={styles.gridLine} />
          <div className={styles.gridLine} />
          <div className={styles.gridLine} />
        </div>

        {/* Animated bars */}
        <div className={styles.barsContainer}>
          {barData.map((bar) => (
            <div key={`${loadingCounter}-${bar.id}`} className={styles.barWrapper}>
              <div
                className={styles.bar}
                style={{
                  height: `${bar.height}%`,
                  backgroundColor: bar.color,
                  animationDelay: `${bar.delay}s`,
                }}
              />
            </div>
          ))}
        </div>
      </div>
      <div className={styles.loadingText}>Loading chart data...</div>
    </div>
  );
};
