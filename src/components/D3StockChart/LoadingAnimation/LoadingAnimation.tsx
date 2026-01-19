import { useEffect, useMemo, useState } from 'react';
import styles from './LoadingAnimation.module.scss';

// Animation duration constant (in ms)
// IMPORTANT: Must match CSS animation duration in LoadingAnimation.module.scss (.loadingLine1, .loadingLine2)
const LOADING_ANIMATION_DURATION = 3000;

export const LoadingAnimation = () => {
  // Counter to regenerate lines on each animation loop
  const [loadingCounter, setLoadingCounter] = useState(0);

  // Set up timing for animation cycle - regenerate after animation completes
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingCounter((prev) => prev + 1);
    }, LOADING_ANIMATION_DURATION);

    return () => clearInterval(interval);
  }, []);

  // Generate completely random loading lines
  const loadingLines = useMemo(() => {
    const numPoints = 30;
    const width = 300;
    const minY = 20;
    const maxY = 150;

    // Generate completely random line 1
    const line1Points: { x: number; y: number }[] = [];
    let y1 = minY + Math.random() * (maxY - minY); // Random start
    for (let i = 0; i < numPoints; i++) {
      const x = 10 + (i * (width - 20)) / (numPoints - 1);
      // Random walk with momentum
      const change = (Math.random() - 0.5) * 25;
      y1 = Math.max(minY, Math.min(maxY, y1 + change));
      line1Points.push({ x, y: y1 });
    }

    // Generate completely random line 2
    const line2Points: { x: number; y: number }[] = [];
    let y2 = minY + Math.random() * (maxY - minY); // Random start
    for (let i = 0; i < numPoints; i++) {
      const x = 10 + (i * (width - 20)) / (numPoints - 1);
      // Random walk with momentum
      const change = (Math.random() - 0.5) * 25;
      y2 = Math.max(minY, Math.min(maxY, y2 + change));
      line2Points.push({ x, y: y2 });
    }

    // Determine colors based on which line ends higher (lower y = higher position)
    const line1EndY = line1Points[line1Points.length - 1].y;
    const line2EndY = line2Points[line2Points.length - 1].y;
    const line1Color = line1EndY < line2EndY ? '#22c55e' : '#ef4444'; // green if higher, red if lower
    const line2Color = line2EndY < line1EndY ? '#22c55e' : '#ef4444'; // green if higher, red if lower

    // Convert points to SVG path
    const line1Path = line1Points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(' ');
    const line2Path = line2Points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(' ');

    return {
      line1: line1Path,
      line2: line2Path,
      line1Color,
      line2Color,
    };
  }, [loadingCounter]);

  return (
    <div className={styles.loadingOverlay}>
      <svg className={styles.loadingSvg} width="300" height="170" viewBox="0 0 300 170">
        {/* Background grid lines */}
        <line
          className={styles.gridLine}
          x1="0"
          y1="42.5"
          x2="300"
          y2="42.5"
          stroke="#e5e7eb"
          strokeWidth="1"
          opacity="0.3"
        />
        <line
          className={styles.gridLine}
          x1="0"
          y1="85"
          x2="300"
          y2="85"
          stroke="#e5e7eb"
          strokeWidth="1"
          opacity="0.3"
        />
        <line
          className={styles.gridLine}
          x1="0"
          y1="127.5"
          x2="300"
          y2="127.5"
          stroke="#e5e7eb"
          strokeWidth="1"
          opacity="0.3"
        />

        {/* Animated stock chart lines with random movements */}
        <path
          key={`line1-${loadingCounter}`}
          className={styles.loadingLine1}
          d={loadingLines.line1}
          fill="none"
          stroke={loadingLines.line1Color}
          strokeWidth="2.5"
        />
        <path
          key={`line2-${loadingCounter}`}
          className={styles.loadingLine2}
          d={loadingLines.line2}
          fill="none"
          stroke={loadingLines.line2Color}
          strokeWidth="2.5"
        />
      </svg>
      <div className={styles.loadingText}>Loading chart data...</div>
    </div>
  );
};
