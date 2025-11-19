import { useEffect, useState } from 'react';
import styles from './LoadingAnimation.module.scss';

const LOADING_ANIMATION_DURATION = 2500;

export const LoadingAnimation = () => {
  const [loadingCounter, setLoadingCounter] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingCounter((prev) => prev + 1);
    }, LOADING_ANIMATION_DURATION);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.loadingOverlay}>
      <div className={styles.loadingContainer}>
        <div className={styles.loadingBars}>
          {[...Array(5)].map((_, i) => (
            <div key={`${loadingCounter}-${i}`} className={styles.loadingBar} />
          ))}
        </div>
        <div className={styles.loadingText}>Loading chart data...</div>
      </div>
    </div>
  );
};
