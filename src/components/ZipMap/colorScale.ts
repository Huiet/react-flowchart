import * as d3 from 'd3';

export function createColorScale(values: number[]) {
  if (values.length === 0) {
    return { scale: () => '#ddd', min: 0, max: 0 };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);

  const scale = d3.scaleSequential(d3.interpolateBlues).domain([min, max]);

  return { scale, min, max };
}
