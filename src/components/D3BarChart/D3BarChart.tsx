import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { BarDataPoint, BarSeries, D3BarChartProps } from './types';
import styles from './D3BarChart.module.css';

interface TooltipData {
  category: string;
  values: Array<{ key: string; label: string; value: number; color: string }>;
  total: number;
  x: number;
  y: number;
}

export const D3BarChart: React.FC<D3BarChartProps> = ({
  data,
  series,
  width: propWidth,
  height: propHeight,
  margins = { top: 40, right: 20, bottom: 100, left: 80 },
  showValues = true,
  showLegend = true,
  valueFormatter = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(0)}MM`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toFixed(0);
  },
  yAxisLabel = '',
  xAxisLabel = '',
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({
    width: propWidth || 800,
    height: propHeight || 500,
  });
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());

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

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return;

    // Clear previous render
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current);
    const innerWidth = width - margins.left - margins.right;
    const innerHeight = height - margins.top - margins.bottom;

    // Filter out hidden series
    const visibleSeries = series.filter((s) => !hiddenSeries.has(s.key));

    // Filter out data points where all values are 0
    const filteredData = data.filter((d) => {
      return Object.values(d.values).some((value) => value > 0);
    });

    // Create main group
    const g = svg.append('g').attr('transform', `translate(${margins.left},${margins.top})`);

    // Create scales
    const x0 = d3
      .scaleBand()
      .domain(filteredData.map((d) => d.category))
      .range([0, innerWidth])
      .padding(0.2);

    const x1 = d3
      .scaleBand()
      .domain(visibleSeries.map((s) => s.key))
      .range([0, x0.bandwidth()])
      .padding(0.05);

    // Calculate max value across all visible series (or use all series if none visible)
    const maxValue = visibleSeries.length > 0
      ? d3.max(filteredData, (d) =>
          d3.max(visibleSeries, (s) => d.values[s.key] || 0)
        ) || 0
      : d3.max(filteredData, (d) =>
          d3.max(series, (s) => d.values[s.key] || 0)
        ) || 100; // Default to 100 if no data

    const y = d3
      .scaleLinear()
      .domain([0, maxValue * 1.2]) // Add 20% padding at top for staggered labels
      .range([innerHeight, 0]);

    // Add grid
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(y)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      );

    // Add X axis
    g.append('g')
      .attr('class', 'axis x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x0))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .attr('dx', '-0.8em')
      .attr('dy', '0.15em');

    // Add Y axis
    g.append('g')
      .attr('class', 'axis y-axis')
      .call(d3.axisLeft(y).tickFormat((d) => valueFormatter(d as number)));

    // Add Y axis label
    if (yAxisLabel) {
      svg
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 15)
        .attr('x', -(height / 2))
        .style('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('fill', '#666')
        .text(yAxisLabel);
    }

    // Add X axis label
    if (xAxisLabel) {
      svg
        .append('text')
        .attr('transform', `translate(${width / 2},${height - 10})`)
        .style('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('fill', '#666')
        .text(xAxisLabel);
    }

    // Add mouseleave handler to SVG to hide tooltip when leaving chart area
    svg.on('mouseleave', () => {
      setTooltip(null);
      d3.selectAll('.bar').style('opacity', 1);
    });

    // Create groups for each category
    const categoryGroups = g
      .selectAll('.category-group')
      .data(filteredData)
      .enter()
      .append('g')
      .attr('class', 'category-group')
      .attr('transform', (d) => `translate(${x0(d.category)},0)`);

    // Only render bars if there are visible series
    if (visibleSeries.length > 0) {
      // Add bars
      categoryGroups
        .selectAll('.bar')
        .data((d) =>
          visibleSeries.map((s) => ({
            key: s.key,
            value: d.values[s.key] || 0,
            category: d.category,
            color: s.color,
            label: s.label,
          }))
        )
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', (d) => x1(d.key) || 0)
        .attr('y', (d) => y(d.value))
        .attr('width', x1.bandwidth())
        .attr('height', (d) => innerHeight - y(d.value))
        .attr('fill', (d) => d.color)
        .on('mouseenter', function (event, d) {
          // Get all values for this category
          const categoryData = filteredData.find((item) => item.category === d.category);
          if (!categoryData) return;

          const tooltipValues = visibleSeries.map((s) => ({
            key: s.key,
            label: s.label,
            value: categoryData.values[s.key] || 0,
            color: s.color,
          }));

          // Calculate total
          const total = tooltipValues.reduce((sum, val) => sum + val.value, 0);

          // Get mouse position relative to container
          const containerRect = containerRef.current?.getBoundingClientRect();
          const mouseX = containerRect ? event.clientX - containerRect.left : event.clientX;
          const mouseY = containerRect ? event.clientY - containerRect.top : event.clientY;

          setTooltip({
            category: d.category,
            values: tooltipValues,
            total: total,
            x: mouseX,
            y: mouseY,
          });

          // Highlight all bars in this group
          d3.selectAll('.bar')
            .filter((barData: any) => barData.category === d.category)
            .style('opacity', 0.8);
        })
        .on('mousemove', (event) => {
          // Get mouse position relative to container
          const containerRect = containerRef.current?.getBoundingClientRect();
          const mouseX = containerRect ? event.clientX - containerRect.left : event.clientX;
          const mouseY = containerRect ? event.clientY - containerRect.top : event.clientY;

          setTooltip((prev) =>
            prev
              ? {
                  ...prev,
                  x: mouseX,
                  y: mouseY,
                }
              : null
          );
        })
        .on('mouseleave', function () {
          // Hide tooltip when leaving an individual bar
          setTooltip(null);
          // Reset all bars
          d3.selectAll('.bar').style('opacity', 1);
        });
    }

    // Add value labels with collision-aware positioning
    if (showValues && visibleSeries.length > 0) {
      categoryGroups.each(function (categoryData) {
        const group = d3.select(this);

        // Track placed labels for collision detection (left to right)
        const placedLabels: Array<{
          centerX: number;
          baselineY: number;
          width: number;
          height: number;
        }> = [];

        visibleSeries.forEach((s) => {
          const value = categoryData.values[s.key] || 0;
          if (value === 0) return;

          const barX = x1(s.key) || 0;
          const barY = y(value);
          const barCenterX = barX + x1.bandwidth() / 2;

          // Format the value to get text
          const labelText = valueFormatter(value);

          // Estimate label dimensions
          // For 11px font (from CSS .bar-label): ~7px per character, ~11px height
          const labelWidth = labelText.length * 7;
          const labelHeight = 11;
          const padding = 4; // White background padding

          // Initial position (above bar)
          let labelY = barY - 5;
          let needsStagger = false;

          // Helper to calculate bounding box
          const getBoundingBox = (centerX: number, baselineY: number) => ({
            left: centerX - labelWidth / 2 - padding,
            right: centerX + labelWidth / 2 + padding,
            top: baselineY - labelHeight - padding,
            bottom: baselineY + padding,
          });

          // Check for collision with previously placed labels
          const currentBox = getBoundingBox(barCenterX, labelY);

          for (const placedLabel of placedLabels) {
            const placedBox = getBoundingBox(placedLabel.centerX, placedLabel.baselineY);

            // Check if rectangles overlap
            if (
              !(
                currentBox.right < placedBox.left ||
                currentBox.left > placedBox.right ||
                currentBox.bottom < placedBox.top ||
                currentBox.top > placedBox.bottom
              )
            ) {
              needsStagger = true;
              break;
            }
          }

          // If collision detected, stagger the label
          if (needsStagger) {
            labelY = barY - 5 - (labelHeight * 2); // Move up by 2x label height
          }

          // Recalculate bounding box with final position
          const finalBox = getBoundingBox(barCenterX, labelY);

          // Add white background rectangle
          group
            .append('rect')
            .attr('class', 'bar-label-bg')
            .attr('x', finalBox.left)
            .attr('y', finalBox.top)
            .attr('width', finalBox.right - finalBox.left)
            .attr('height', finalBox.bottom - finalBox.top)
            .attr('fill', 'white')
            .style('pointer-events', 'none');

          // Add label
          group
            .append('text')
            .attr('class', 'bar-label')
            .attr('x', barCenterX)
            .attr('y', labelY)
            .attr('text-anchor', 'middle')
            .text(labelText);

          // Add connecting line if label is staggered
          if (needsStagger) {
            group
              .append('line')
              .attr('class', 'label-connector')
              .attr('x1', barCenterX)
              .attr('y1', labelY + 4)
              .attr('x2', barCenterX)
              .attr('y2', barY - 5)
              .attr('stroke', '#999')
              .attr('stroke-width', 1)
              .attr('stroke-dasharray', '2,2')
              .style('pointer-events', 'none');
          }

          // Record this label's position for future collision checks
          placedLabels.push({
            centerX: barCenterX,
            baselineY: labelY,
            width: labelWidth + padding * 2,
            height: labelHeight + padding * 2,
          });
        });
      });
    }
  }, [
    data,
    series,
    dimensions,
    margins,
    showValues,
    valueFormatter,
    yAxisLabel,
    xAxisLabel,
    hiddenSeries,
  ]);

  const handleLegendClick = (key: string) => {
    setHiddenSeries((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  return (
    <div ref={containerRef} className={styles.chartContainer}>
      <svg ref={svgRef} className={styles.svg} width={width} height={height} />

      {/* Tooltip */}
      {tooltip && (
        <div
          className={styles.tooltip}
          style={{
            // Position tooltip on the left when near the right edge
            left: tooltip.x > width - 250 ? tooltip.x - 180 : tooltip.x + 15,
            top: tooltip.y - 10,
          }}
        >
          <div className={styles.tooltipCategory}>{tooltip.category}</div>
          {tooltip.values.map((val) => (
            <div key={val.key} className={styles.tooltipLine}>
              <div className={styles.tooltipLineName}>
                <div className={styles.tooltipColorDot} style={{ backgroundColor: val.color }} />
                <span className={styles.tooltipLabel}>{val.label}:</span>
              </div>
              <span className={styles.tooltipValue}>
                {val.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </span>
            </div>
          ))}
          {tooltip.values.length > 1 && (
            <div
              className={styles.tooltipLine}
              style={{
                marginTop: '8px',
                paddingTop: '8px',
                borderTop: '1px solid #eee',
                fontWeight: 'bold',
              }}
            >
              <span className={styles.tooltipLabel}>Total:</span>
              <span className={styles.tooltipValue}>
                {tooltip.total.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      {showLegend && (
        <div className={styles.legend}>
          {series.map((s) => (
            <div
              key={s.key}
              className={`${styles.legendItem} ${hiddenSeries.has(s.key) ? styles.disabled : ''}`}
              onClick={() => handleLegendClick(s.key)}
            >
              <div className={styles.legendColorBox} style={{ backgroundColor: s.color }} />
              <div className={styles.legendLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
