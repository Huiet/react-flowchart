import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type {
  UsersChartProps,
  TooltipData,
  HoverData,
  ChartMargins,
} from './types';
import styles from './UsersChart.module.css';
import { LoadingAnimation } from './LoadingAnimation/LoadingAnimation';

export const UsersChart: React.FC<UsersChartProps> = ({
  data,
  series,
  width: propWidth,
  height: propHeight,
  margins = { top: 10, right: 10, bottom: 40, left: 40 },
  showLegend = true,
  isLoading = false,
  metricsSummary = { newCount: 0, returnCount: 0 },
  newLabel = 'New',
  returnLabel = 'Return',
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const metricsContainerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [hoverData, setHoverData] = useState<HoverData | null>(null);
  const lastDataPointRef = useRef<any>(null);
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());
  const [dimensions, setDimensions] = useState({
    width: propWidth || 800,
    height: propHeight || 400,
  });

  // Responsive sizing - observe the chart container specifically
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (!propWidth || !propHeight) {
          setDimensions({
            width: propWidth || width,
            height: propHeight || height || 400,
          });
        }
      }
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [propWidth, propHeight]);

  // Main D3 rendering
  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0 || series.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;
    const innerWidth = width - margins.left - margins.right;
    const innerHeight = height - margins.top - margins.bottom;

    // Filter visible series
    const visibleSeries = series.filter((s) => !hiddenSeries.has(s.key));
    if (visibleSeries.length === 0) return;

    // Create main group
    const g = svg
      .append('g')
      .attr('transform', `translate(${margins.left},${margins.top})`);

    // Prepare stacked data
    const stack = d3
      .stack<any>()
      .keys(visibleSeries.map((s) => s.key))
      .value((d, key) => d.values[key] || 0);

    const stackedData = stack(data);

    // Scales
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => d.date) as [Date, Date])
      .range([0, innerWidth]);

    const yMax = d3.max(stackedData[stackedData.length - 1], (d) => d[1]) || 0;
    const yScale = d3
      .scaleLinear()
      .domain([0, yMax * 1.1])
      .range([innerHeight, 0])
      .nice();

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data(yScale.ticks())
      .join('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', '#e0e0e0')
      .attr('stroke-width', 1);

    // X Axis
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(d3.timeMonth.every(1))
      .tickFormat((d) => d3.timeFormat('%b')(d as Date));

    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#666');

    // Y Axis
    const yAxis = d3.axisLeft(yScale).ticks(5);

    g.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#666');

    // Remove axis domain lines
    g.selectAll('.x-axis path, .y-axis path').remove();
    g.selectAll('.x-axis .tick line, .y-axis .tick line').remove();

    // Area generator
    const area = d3
      .area<any>()
      .x((d) => xScale(d.data.date))
      .y0((d) => yScale(d[0]))
      .y1((d) => yScale(d[1]))
      .curve(d3.curveMonotoneX);

    // Line generator (for top edge)
    const line = d3
      .line<any>()
      .x((d) => xScale(d.data.date))
      .y((d) => yScale(d[1]))
      .curve(d3.curveMonotoneX);

    // Draw areas
    const areas = g
      .selectAll('.area-group')
      .data(stackedData)
      .join('g')
      .attr('class', 'area-group');

    areas
      .append('path')
      .attr('class', 'area')
      .attr('d', area)
      .attr('fill', (d, i) => visibleSeries[i].color)
      .attr('opacity', 0.6);

    areas
      .append('path')
      .attr('class', 'area-line')
      .attr('d', line)
      .attr('stroke', (d, i) => visibleSeries[i].color)
      .attr('stroke-width', 2)
      .attr('fill', 'none');

    // Hover interaction overlay
    const bisectDate = d3.bisector<any, Date>((d) => d.date).left;

    const focus = g.append('g').attr('class', 'focus');

    focus
      .append('line')
      .attr('class', 'hover-line')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#666')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      .attr('opacity', 0);

    const overlay = g
      .append('rect')
      .attr('class', 'overlay')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .style('fill', 'none')
      .style('pointer-events', 'all');

    let rafId: number | null = null;

    overlay
      .on('mousemove', function (event) {
        const [mouseX, mouseY] = d3.pointer(event);
        const x0 = xScale.invert(mouseX);
        const i = bisectDate(data, x0, 1);

        // Handle edge cases
        let d;
        if (i === 0) {
          d = data[0];
        } else if (i >= data.length) {
          d = data[data.length - 1];
        } else {
          const d0 = data[i - 1];
          const d1 = data[i];
          d = x0.getTime() - d0.date.getTime() > d1.date.getTime() - x0.getTime() ? d1 : d0;
        }

        if (!d) return;

        // Use requestAnimationFrame to batch DOM updates and prevent flickering
        if (rafId) cancelAnimationFrame(rafId);

        rafId = requestAnimationFrame(() => {
          // Position vertical line at the nearest data point
          const dataPointX = xScale(d.date);
          const hoverLine = d3.select(svgRef.current).select('.hover-line');

          hoverLine
            .attr('x1', dataPointX)
            .attr('x2', dataPointX)
            .attr('opacity', 1);

          // Only update React state if the data point has actually changed
          // Compare by date to avoid object reference issues
          const currentDate = lastDataPointRef.current?.date?.getTime();
          const newDate = d.date.getTime();

          if (currentDate !== newDate) {
            lastDataPointRef.current = d;

            // Update tooltip - track mouse position closely
            const containerRect = containerRef.current?.getBoundingClientRect();
            const mouseXAbs = containerRect ? event.clientX - containerRect.left : event.clientX;
            const mouseYAbs = containerRect ? event.clientY - containerRect.top : event.clientY;

            const tooltipValues = visibleSeries.map((s) => ({
              key: s.key,
              label: s.label,
              value: d.values[s.key] || 0,
              color: s.color,
            }));

            setTooltip({
              date: d.date,
              values: tooltipValues,
              x: mouseXAbs,
              y: mouseYAbs,
            });

            // Update hover data for metrics bars
            const total = visibleSeries.reduce((sum, s) => sum + (d.values[s.key] || 0), 0);
            setHoverData({
              date: d.date,
              values: d.values,
              total,
            });
          }
        });
      })
      .on('mouseenter', function () {
        if (rafId) cancelAnimationFrame(rafId);
        const hoverLine = d3.select(svgRef.current).select('.hover-line');
        hoverLine.attr('opacity', 1);
      })
      .on('mouseleave', function () {
        if (rafId) cancelAnimationFrame(rafId);
        const hoverLine = d3.select(svgRef.current).select('.hover-line');
        hoverLine.attr('opacity', 0);
        setTooltip(null);
        setHoverData(null);
        lastDataPointRef.current = null;
      });
  }, [data, series, dimensions, margins, hiddenSeries]);

  // Handle legend/bar click
  const handleSeriesToggle = (key: string) => {
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

  // Calculate percentages for bars
  const getBarData = () => {
    if (hoverData) {
      // Use hover data - only calculate percentages for visible series
      const visibleSeriesKeys = series.filter((s) => !hiddenSeries.has(s.key)).map((s) => s.key);
      const visibleTotal = visibleSeriesKeys.reduce((sum, key) => sum + (hoverData.values[key] || 0), 0);

      return series.map((s) => {
        // Hidden series should show 0%
        if (hiddenSeries.has(s.key)) {
          return {
            ...s,
            percentage: 0,
            value: 0,
          };
        }

        const value = hoverData.values[s.key] || 0;
        const percentage = visibleTotal > 0 ? (value / visibleTotal) * 100 : 0;
        return {
          ...s,
          percentage,
          value,
        };
      });
    } else {
      // Use latest data point - only calculate percentages for visible series
      const latestData = data[data.length - 1];
      if (!latestData) return series.map((s) => ({ ...s, percentage: 0, value: 0 }));

      const visibleSeriesKeys = series.filter((s) => !hiddenSeries.has(s.key)).map((s) => s.key);
      const visibleTotal = visibleSeriesKeys.reduce((sum, key) => sum + (latestData.values[key] || 0), 0);

      return series.map((s) => {
        // Hidden series should show 0%
        if (hiddenSeries.has(s.key)) {
          return {
            ...s,
            percentage: 0,
            value: 0,
          };
        }

        const value = latestData.values[s.key] || 0;
        const percentage = visibleTotal > 0 ? (value / visibleTotal) * 100 : 0;
        return {
          ...s,
          percentage,
          value,
        };
      });
    }
  };

  const barData = getBarData();

  return (
    <div ref={containerRef} className={styles.container}>
      {/* Chart Section */}
      <div className={styles.chartSection}>
        <div className={styles.chartHeader}>
          <h3 className={styles.chartTitle}>Users</h3>
          {showLegend && (
            <div className={styles.legend}>
              {series.map((s) => (
                <div
                  key={s.key}
                  className={`${styles.legendItem} ${hiddenSeries.has(s.key) ? styles.disabled : ''}`}
                  onClick={() => handleSeriesToggle(s.key)}
                >
                  <div className={styles.legendColorBox} style={{ backgroundColor: s.color }} />
                  <div className={styles.legendLabel}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div ref={chartContainerRef} className={styles.chartContainer}>
          <svg ref={svgRef} width={dimensions.width} height={dimensions.height} />
          {isLoading && <LoadingAnimation />}
          {tooltip && (
            <div
              className={styles.tooltip}
              style={{
                left: tooltip.x > dimensions.width - 200 ? tooltip.x - 180 : tooltip.x + 15,
                top: tooltip.y - 10,
              }}
            >
              <div className={styles.tooltipDate}>
                {d3.timeFormat('%b %d, %Y')(tooltip.date)}
              </div>
              {tooltip.values.map((v) => (
                <div key={v.key} className={styles.tooltipRow}>
                  <div className={styles.tooltipColor} style={{ backgroundColor: v.color }} />
                  <div className={styles.tooltipLabel}>{v.label}:</div>
                  <div className={styles.tooltipValue}>{v.value.toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Metrics Section */}
      <div ref={metricsContainerRef} className={styles.metricsSection}>
        <div className={styles.metricsCounts}>
          <div className={styles.metricItem}>
            <div className={styles.metricLabel}>{newLabel}:</div>
            <div className={styles.metricValue}>{metricsSummary.newCount.toLocaleString()}</div>
          </div>
          <div className={styles.metricItem}>
            <div className={styles.metricLabel}>{returnLabel}:</div>
            <div className={styles.metricValue}>{metricsSummary.returnCount.toLocaleString()}</div>
          </div>
        </div>

        <div className={styles.barsContainer}>
          {barData.map((item) => (
            <div
              key={item.key}
              className={`${styles.barRow} ${hiddenSeries.has(item.key) ? styles.disabled : ''}`}
              onClick={() => handleSeriesToggle(item.key)}
            >
              <div className={styles.barLabel}>{item.label}</div>
              <div className={styles.barWrapper}>
                <div
                  className={styles.barFill}
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
              <div className={styles.barPercentage}>{Math.round(item.percentage)}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
