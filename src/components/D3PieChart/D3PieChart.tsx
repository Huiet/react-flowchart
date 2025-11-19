import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ChartType, D3PieChartProps } from './types';
import { LoadingAnimation } from './LoadingAnimation';
import styles from './D3PieChart.module.css';

const DEFAULT_COLORS = [
  '#2563eb', // blue
  '#dc2626', // red
  '#16a34a', // green
  '#ea580c', // orange
  '#9333ea', // purple
  '#0891b2', // cyan
  '#ca8a04', // yellow
  '#e11d48', // pink
  '#4f46e5', // indigo
  '#059669', // emerald
];

interface TooltipData {
  label: string;
  count: number;
  value: number;
  percentage: number;
  x: number;
  y: number;
}

export const D3PieChart: React.FC<D3PieChartProps> = ({
  data,
  width: propWidth,
  height: propHeight,
  chartType: propChartType = 'pie',
  showLegend = true,
  showLabels = true,
  isLoading = false,
  colorScheme = DEFAULT_COLORS,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [dimensions, setDimensions] = useState({
    width: propWidth || 800,
    height: propHeight || 600,
  });

  // Handle container resize
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (!propWidth || !propHeight) {
          setDimensions({
            width: propWidth || width,
            height: propHeight || height,
          });
        }
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [propWidth, propHeight]);

  const { width, height } = dimensions;

  // Calculate center text size based on chart dimensions
  const radius = Math.min(width, height) / 2 - 10;
  const labelFontSize = Math.max(10, radius * 0.08);
  const valueFontSize = Math.max(16, radius * 0.15);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    // Clear previous render
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current);

    // Calculate dimensions - minimal padding
    const radius = Math.min(width, height) / 2 - 10;
    const innerRadius = propChartType === 'donut' ? radius * 0.6 : 0;

    // Create main group
    const g = svg
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    // Calculate total value
    const totalValue = d3.sum(data, (d) => d.value);

    // Create color scale
    const colorScale = d3
      .scaleOrdinal<string>()
      .domain(data.map((d) => d.label))
      .range(colorScheme);

    // Create pie layout
    const pie = d3
      .pie<(typeof data)[0]>()
      .value((d) => d.value)
      .sort(null); // Keep original order

    // Create arc generator
    const arc = d3
      .arc<d3.PieArcDatum<(typeof data)[0]>>()
      .innerRadius(innerRadius)
      .outerRadius(radius);

    // Create arc for labels (positioned at outer edge)
    const labelArc = d3
      .arc<d3.PieArcDatum<(typeof data)[0]>>()
      .innerRadius(radius * 0.8)
      .outerRadius(radius * 0.8);

    // Create slices
    const slices = g
      .selectAll('.slice')
      .data(pie(data))
      .enter()
      .append('g')
      .attr('class', 'slice');

    // Add paths
    slices
      .append('path')
      .attr('d', arc)
      .attr('fill', (d) => colorScale(d.data.label))
      .on('mouseenter', function (event, d) {
        const [mouseX, mouseY] = d3.pointer(event, svgRef.current);
        const percentage = (d.data.value / totalValue) * 100;

        setTooltip({
          label: d.data.label,
          count: d.data.count,
          value: d.data.value,
          percentage,
          x: mouseX,
          y: mouseY,
        });

        // Highlight slice
        d3.select(this).style('opacity', 0.8);
      })
      .on('mousemove', function (event) {
        const [mouseX, mouseY] = d3.pointer(event, svgRef.current);
        setTooltip((prev) => (prev ? { ...prev, x: mouseX, y: mouseY } : null));
      })
      .on('mouseleave', function () {
        setTooltip(null);
        d3.select(this).style('opacity', 1);
      });

  }, [data, width, height, propChartType, showLabels, colorScheme]);

  return (
    <div ref={containerRef} className={styles.chartContainer}>
      <svg ref={svgRef} className={styles.svg} width={width} height={height} />

      {/* Loading State */}
      {isLoading && <LoadingAnimation chartType={propChartType} />}

      {/* Tooltip */}
      {tooltip && (
        <div
          className={styles.tooltip}
          style={{
            left: tooltip.x > width - 200 ? tooltip.x - 180 : tooltip.x + 15,
            top: tooltip.y - 10,
          }}
        >
          <div className={styles.tooltipLabel}>{tooltip.label}</div>
          <div className={styles.tooltipRow}>
            <span className={styles.tooltipKey}>Count:</span>
            <span className={styles.tooltipValue}>{tooltip.count.toLocaleString()}</span>
          </div>
          <div className={styles.tooltipRow}>
            <span className={styles.tooltipKey}>Value:</span>
            <span className={styles.tooltipValue}>${tooltip.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className={styles.tooltipRow}>
            <span className={styles.tooltipKey}>Percentage:</span>
            <span className={styles.tooltipValue}>{tooltip.percentage.toFixed(1)}%</span>
          </div>
        </div>
      )}

      {/* Center text for donut */}
      {propChartType === 'donut' && (
        <div className={styles.centerText}>
          <div className={styles.centerTextLabel} style={{ fontSize: `${labelFontSize}px` }}>
            Total Value
          </div>
          <div className={styles.centerTextValue} style={{ fontSize: `${valueFontSize}px` }}>
            ${(d3.sum(data, (d) => d.value) / 1000000).toFixed(1)}M
          </div>
        </div>
      )}
    </div>
  );
};
