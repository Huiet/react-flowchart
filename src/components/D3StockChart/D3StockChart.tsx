import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  D3StockChartProps,
  StockLine,
  CustomAnnotation,
  ReferenceLine,
  StockDataPoint,
  DateRange,
} from './types';
import styles from './D3StockChart.module.css';

interface TooltipData {
  date: Date;
  values: {
    lineId: string;
    lineName: string;
    value: number;
    color: string;
  }[];
  x: number;
  y: number;
}

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: '1W', label: '1W' },
  { value: '1M', label: '1M' },
  { value: '3M', label: '3M' },
  { value: 'YTD', label: 'YTD' },
  { value: '1Y', label: '1Y' },
  { value: '5Y', label: '5Y' },
  { value: 'ALL', label: 'All' },
];

export const D3StockChart: React.FC<D3StockChartProps> = ({
  lines,
  width = 800,
  height = 500,
  margins = { top: 20, right: 120, bottom: 70, left: 60 },
  showMinMaxAnnotations = true,
  customAnnotations = [],
  referenceLines = [],
  onLineToggle,
  defaultDateRange = 'ALL',
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [internalLines, setInternalLines] = useState<StockLine[]>(lines);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>(defaultDateRange);

  // Update internal state when lines prop changes
  useEffect(() => {
    setInternalLines(lines);
  }, [lines]);

  // Calculate date range boundaries
  const getDateRangeStart = (endDate: Date, range: DateRange): Date => {
    const start = new Date(endDate);

    switch (range) {
      case '1W':
        start.setDate(start.getDate() - 7);
        break;
      case '1M':
        start.setMonth(start.getMonth() - 1);
        break;
      case '3M':
        start.setMonth(start.getMonth() - 3);
        break;
      case 'YTD':
        start.setMonth(0);
        start.setDate(1);
        break;
      case '1Y':
        start.setFullYear(start.getFullYear() - 1);
        break;
      case '5Y':
        start.setFullYear(start.getFullYear() - 5);
        break;
      case 'ALL':
        return new Date(0); // Return epoch for all data
    }

    return start;
  };

  // Calculate available date range from all lines
  const dataDateRange = useMemo(() => {
    const allLines = internalLines.filter(line => line.data.length > 0);
    if (allLines.length === 0) return null;

    const allDates = allLines.flatMap(line => line.data.map(d => d.date));
    const minDate = d3.min(allDates);
    const maxDate = d3.max(allDates);

    if (!minDate || !maxDate) return null;

    return { minDate, maxDate };
  }, [internalLines]);

  // Check if a date range is available based on actual data
  const isDateRangeAvailable = (range: DateRange): boolean => {
    if (!dataDateRange) return false;

    const { minDate, maxDate } = dataDateRange;
    const daysDiff = (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);

    switch (range) {
      case '1W':
        return daysDiff >= 7;
      case '1M':
        return daysDiff >= 30;
      case '3M':
        return daysDiff >= 90;
      case 'YTD':
        // Check if data goes back to January 1 of current year
        const jan1 = new Date(maxDate.getFullYear(), 0, 1);
        return minDate <= jan1;
      case '1Y':
        return daysDiff >= 365;
      case '5Y':
        return daysDiff >= 365 * 5;
      case 'ALL':
        return true;
      default:
        return false;
    }
  };

  // Filter lines data based on selected date range
  const filteredLines = useMemo(() => {
    const visibleLines = internalLines.filter((line) => line.visible);

    if (visibleLines.length === 0) return [];

    // Get the latest date across all lines
    const allDates = visibleLines.flatMap(line => line.data.map(d => d.date));
    const latestDate = d3.max(allDates) || new Date();
    const startDate = getDateRangeStart(latestDate, selectedDateRange);

    return visibleLines.map(line => ({
      ...line,
      data: line.data.filter(d => d.date >= startDate),
    }));
  }, [internalLines, selectedDateRange]);

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear previous render
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current);
    const innerWidth = width - margins.left - margins.right;
    const innerHeight = height - margins.top - margins.bottom;

    // Create main group
    const g = svg
      .append('g')
      .attr('transform', `translate(${margins.left},${margins.top})`);

    if (filteredLines.length === 0 || filteredLines.every(line => line.data.length === 0)) {
      // Show a message when no lines are visible or no data in range
      g.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#999')
        .attr('font-size', '16px')
        .text('No data to display');
      return;
    }

    // Combine all data points from filtered lines
    const allData = filteredLines.flatMap((line) => line.data);

    // Create scales
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(allData, (d) => d.date) as [Date, Date])
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([
        d3.min(allData, (d) => d.value)! * 0.95,
        d3.max(allData, (d) => d.value)! * 1.05,
      ])
      .range([innerHeight, 0]);

    // Add grid
    g.append('g')
      .attr('class', 'grid x-grid')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(
        d3
          .axisBottom(xScale)
          .tickSize(innerHeight)
          .tickFormat(() => '')
      );

    g.append('g')
      .attr('class', 'grid y-grid')
      .call(
        d3
          .axisLeft(yScale)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      );

    // Draw lines
    filteredLines.forEach((line) => {
      const lineGenerator = d3
        .line<typeof line.data[0]>()
        .x((d) => xScale(d.date))
        .y((d) => yScale(d.value))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(line.data)
        .attr('class', `line line-${line.id}`)
        .attr('d', lineGenerator)
        .attr('stroke', line.color)
        .attr('fill', 'none');
    });

    // Min/max annotations removed - use custom annotations instead

    // Get domain for filtering annotations and reference lines
    const [domainMinDate, domainMaxDate] = xScale.domain();

    // Add custom annotations (filter by visible date range)
    customAnnotations
      .filter(annotation => annotation.date >= domainMinDate && annotation.date <= domainMaxDate)
      .forEach((annotation) => {
        g.append('circle')
          .attr('class', `custom-annotation-dot custom-annotation-${annotation.id}`)
          .attr('cx', xScale(annotation.date))
          .attr('cy', yScale(annotation.value))
          .attr('r', annotation.dotSize || 6)
          .attr('fill', annotation.color)
          .attr('stroke', 'white')
          .attr('stroke-width', 2);

        g.append('text')
          .attr('class', `custom-annotation-label custom-annotation-label-${annotation.id}`)
          .attr('x', xScale(annotation.date) + 8)
          .attr('y', yScale(annotation.value) + 4)
          .text(annotation.label);
      });

    // Add reference lines (filter by visible date range)
    referenceLines.forEach((refLine) => {
      if (refLine.type === 'horizontal') {
        const yPos = yScale(refLine.value as number);
        g.append('line')
          .attr('class', `reference-line reference-line-${refLine.id}`)
          .attr('x1', 0)
          .attr('y1', yPos)
          .attr('x2', innerWidth)
          .attr('y2', yPos)
          .attr('stroke', refLine.color || '#666')
          .attr('stroke-dasharray', refLine.strokeDashArray || '5,5');

        g.append('text')
          .attr('class', `reference-line-label reference-line-label-${refLine.id}`)
          .attr('x', 5)
          .attr('y', yPos - 5)
          .attr('fill', refLine.color || '#666')
          .text(refLine.label);
      } else {
        const refDate = refLine.value as Date;
        if (refDate >= domainMinDate && refDate <= domainMaxDate) {
          const xPos = xScale(refDate);
          g.append('line')
            .attr('class', `reference-line reference-line-${refLine.id}`)
            .attr('x1', xPos)
            .attr('y1', 0)
            .attr('x2', xPos)
            .attr('y2', innerHeight)
            .attr('stroke', refLine.color || '#666')
            .attr('stroke-dasharray', refLine.strokeDashArray || '5,5');

          g.append('text')
            .attr('class', `reference-line-label reference-line-label-${refLine.id}`)
            .attr('x', xPos + 5)
            .attr('y', 15)
            .attr('fill', refLine.color || '#666')
            .text(refLine.label);
        }
      }
    });

    // Calculate optimal number of X-axis ticks based on width
    const minTickSpacing = 80; // Minimum pixels between ticks
    const maxTicks = Math.floor(innerWidth / minTickSpacing);

    // Determine date format based on date range
    const daysDiff = (domainMaxDate.getTime() - domainMinDate.getTime()) / (1000 * 60 * 60 * 24);

    let dateFormat: (date: Date) => string;
    if (daysDiff <= 7) {
      dateFormat = d3.timeFormat('%b %d'); // "Jan 15"
    } else if (daysDiff <= 60) {
      dateFormat = d3.timeFormat('%b %d'); // "Jan 15"
    } else if (daysDiff <= 365) {
      dateFormat = d3.timeFormat('%b %Y'); // "Jan 2024"
    } else {
      dateFormat = d3.timeFormat('%Y'); // "2024"
    }

    // Add axes
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(Math.min(maxTicks, 8))
      .tickFormat(dateFormat as any);

    g.append('g')
      .attr('class', 'axis x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .attr('dx', '-0.5em')
      .attr('dy', '0.5em');

    g.append('g')
      .attr('class', 'axis y-axis')
      .call(d3.axisLeft(yScale).tickFormat((d) => {
        // Format numbers without unnecessary decimals
        const num = d as number;
        return num % 1 === 0 ? d3.format(',')(num) : d3.format(',.2f')(num);
      }));

    // Add axis labels
    svg
      .append('text')
      .attr('transform', `translate(${width / 2},${height - 10})`)
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#666')
      .text('Date');

    svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 15)
      .attr('x', -(height / 2))
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#666')
      .text('Price');

    // Add crosshair lines (initially hidden)
    const crosshairGroup = g.append('g').attr('class', 'crosshair-group').style('display', 'none');

    crosshairGroup
      .append('line')
      .attr('class', 'crosshair crosshair-x')
      .attr('y1', 0)
      .attr('y2', innerHeight);

    crosshairGroup
      .append('line')
      .attr('class', 'crosshair crosshair-y')
      .attr('x1', 0)
      .attr('x2', innerWidth);

    // Add mouse tracking overlay
    const mouseOverlay = svg
      .append('rect')
      .attr('class', 'mouse-overlay')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .style('cursor', 'crosshair');

    // Helper function to find nearest data point
    const findNearestPoint = (line: StockLine, targetDate: Date): StockDataPoint | null => {
      if (line.data.length === 0) return null;

      const bisector = d3.bisector<StockDataPoint, Date>((d) => d.date).left;
      const index = bisector(line.data, targetDate);

      if (index === 0) return line.data[0];
      if (index >= line.data.length) return line.data[line.data.length - 1];

      const leftPoint = line.data[index - 1];
      const rightPoint = line.data[index];

      // Return the closest point
      return Math.abs(targetDate.getTime() - leftPoint.date.getTime()) <
        Math.abs(targetDate.getTime() - rightPoint.date.getTime())
        ? leftPoint
        : rightPoint;
    };

    // Mouse move handler
    const handleMouseMove = (event: MouseEvent) => {
      const [mouseX, mouseY] = d3.pointer(event);
      const chartX = mouseX - margins.left;
      const chartY = mouseY - margins.top;

      // Check if mouse is within chart bounds
      if (chartX < 0 || chartX > innerWidth || chartY < 0 || chartY > innerHeight) {
        crosshairGroup.style('display', 'none');
        setTooltip(null);
        return;
      }

      // Show crosshair (ensure it stays visible)
      crosshairGroup.style('display', null);
      crosshairGroup.select('.crosshair-x').attr('x1', chartX).attr('x2', chartX);
      crosshairGroup.select('.crosshair-y').attr('y1', chartY).attr('y2', chartY);

      // Get date at mouse position
      const hoveredDate = xScale.invert(chartX);

      // Find nearest points for all filtered lines
      const tooltipValues = filteredLines
        .map((line) => {
          const nearestPoint = findNearestPoint(line, hoveredDate);
          if (!nearestPoint) return null;

          return {
            lineId: line.id,
            lineName: line.name,
            value: nearestPoint.value,
            color: line.color,
          };
        })
        .filter((v): v is NonNullable<typeof v> => v !== null);

      if (tooltipValues.length > 0) {
        // Get the first point's date for the tooltip header
        const firstLine = filteredLines[0];
        const nearestPoint = findNearestPoint(firstLine, hoveredDate);

        if (nearestPoint) {
          setTooltip({
            date: nearestPoint.date,
            values: tooltipValues,
            x: mouseX,
            y: mouseY,
          });
        }
      }
    };

    // Mouse over handler - ensures crosshair appears when mouse enters
    const handleMouseOver = (event: MouseEvent) => {
      handleMouseMove(event);
    };

    // Mouse leave handler
    const handleMouseLeave = () => {
      crosshairGroup.style('display', 'none');
      setTooltip(null);
    };

    // Attach event listeners
    mouseOverlay.on('mouseover', handleMouseOver);
    mouseOverlay.on('mousemove', handleMouseMove);
    mouseOverlay.on('mouseleave', handleMouseLeave);
  }, [
    filteredLines,
    width,
    height,
    margins,
    showMinMaxAnnotations,
    customAnnotations,
    referenceLines,
  ]);

  const handleLineToggle = (lineId: string) => {
    const updatedLines = internalLines.map((line) =>
      line.id === lineId ? { ...line, visible: !line.visible } : line
    );
    setInternalLines(updatedLines);

    // Call the callback if provided
    const toggledLine = updatedLines.find((line) => line.id === lineId);
    if (onLineToggle && toggledLine) {
      onLineToggle(lineId, toggledLine.visible);
    }
  };

  return (
    <div ref={containerRef} className={styles.chartContainer} style={{ width, height }}>
      <svg ref={svgRef} className={styles.svg} width={width} height={height} />

      {/* Tooltip */}
      {tooltip && (
        <div
          className={styles.tooltip}
          style={{
            left: tooltip.x + 15,
            top: tooltip.y - 10,
          }}
        >
          <div className={styles.tooltipDate}>
            {d3.timeFormat('%b %d, %Y')(tooltip.date)}
          </div>
          {tooltip.values.map((val) => (
            <div key={val.lineId} className={styles.tooltipLine}>
              <div className={styles.tooltipLineName}>
                <div
                  className={styles.tooltipColorDot}
                  style={{ backgroundColor: val.color }}
                />
                <span className={styles.tooltipLabel}>{val.lineName}</span>
              </div>
              <span className={styles.tooltipValue}>${val.value.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Legend and Date Range Selector */}
      <div className={styles.legend}>
        <div className={styles.legendSection}>
          <div className={styles.legendTitle}>Lines</div>
          {internalLines.map((line) => (
            <div
              key={line.id}
              className={`${styles.legendItem} ${
                !line.visible ? styles.disabled : ''
              }`}
              onClick={() => handleLineToggle(line.id)}
            >
              <div
                className={styles.legendColorBox}
                style={{ backgroundColor: line.color }}
              />
              <div className={styles.legendLabel}>{line.name}</div>
            </div>
          ))}
        </div>

        <div className={`${styles.legendSection} ${styles.dateRangeSection}`}>
          <div className={styles.legendTitle}>Time Range</div>
          <div className={styles.dateRangeButtons}>
            {DATE_RANGE_OPTIONS.map((option) => {
              const isAvailable = isDateRangeAvailable(option.value);
              return (
                <button
                  key={option.value}
                  className={`${styles.dateRangeButton} ${
                    selectedDateRange === option.value ? styles.active : ''
                  }`}
                  onClick={() => setSelectedDateRange(option.value)}
                  disabled={!isAvailable}
                  title={!isAvailable ? 'Not enough data for this range' : undefined}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
