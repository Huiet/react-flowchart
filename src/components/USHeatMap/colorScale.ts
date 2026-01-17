import * as d3 from 'd3';

const BLUE_SHADES = ['#eff3ff', '#c6dbef', '#9ecae1', '#6baed6', '#3182bd', '#08519c'];

export function createColorScale(values: number[]) {
  if (values.length === 0) {
    return { scale: () => BLUE_SHADES[0], thresholds: [] };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const q1 = d3.quantile(sorted, 0.25) ?? 0;
  const q3 = d3.quantile(sorted, 0.75) ?? 0;
  const iqr = q3 - q1;
  const median = d3.median(sorted) ?? 0;
  const mean = d3.mean(sorted) ?? 0;

  // Use quantile if data is skewed (mean differs significantly from median)
  const skewRatio = median !== 0 ? Math.abs(mean - median) / median : 0;
  const useQuantile = skewRatio > 0.2 || iqr > median * 0.5;

  if (useQuantile) {
    const scale = d3.scaleQuantile<string>().domain(values).range(BLUE_SHADES);
    return { scale, thresholds: scale.quantiles() };
  }

  const [min, max] = d3.extent(values) as [number, number];
  const scale = d3.scaleQuantize<string>().domain([min, max]).range(BLUE_SHADES);
  return { scale, thresholds: scale.thresholds() };
}

export { BLUE_SHADES };
