import { useEffect, useMemo, useRef, useState } from 'react';
import {
  IconChartLine,
  IconChevronDown,
  IconChevronUp,
  IconGripHorizontal,
  IconMinus,
  IconX,
} from '@tabler/icons-react';
import * as d3 from 'd3';
import { ActionIcon, Group, Menu } from '@mantine/core';
import { calculateBollingerBands, calculateEMA, calculateSMA } from './indicators';
import {
  CustomAnnotation,
  D3StockChartProps,
  DateRange,
  ReferenceLine,
  StockDataPoint,
  StockLine,
  TechnicalIndicators,
} from './types';
import styles from './D3StockChart.module.css';

interface TooltipData {
  date: Date;
  values: {
    lineId: string;
    lineName: string;
    value: number;
    color: string;
    relativeValue?: number;
    relativePercent?: number;
  }[];
  annotations?: string[]; // Labels of nearby annotations
  referenceLines?: string[]; // Labels of nearby reference lines
  x: number;
  y: number;
}

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
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
  margins = { top: 20, right: 20, bottom: 70, left: 60 },
  showMinMaxAnnotations = true,
  customAnnotations = [],
  referenceLines = [],
  onLineToggle,
  defaultDateRange = 'ALL',
  enabledIndicators,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  const [internalLines, setInternalLines] = useState<StockLine[]>(lines);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>(defaultDateRange);
  const [legendPosition, setLegendPosition] = useState({ x: 80, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [referencePoint, setReferencePoint] = useState<{
    date: Date;
    values: Map<string, number>;
  } | null>(null);

  // Use refs for drag state to avoid re-renders during drag
  const dragStateRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    initialPosX: 0,
    initialPosY: 0,
  });

  // Store the xScale so we can use it in click handlers
  const xScaleRef = useRef<d3.ScaleTime<number, number> | null>(null);

  // Initialize per-line indicators
  const [indicators, setIndicators] = useState<Record<string, TechnicalIndicators>>(() => {
    if (enabledIndicators) return enabledIndicators;

    // Initialize with all indicators disabled for each line
    const initialIndicators: Record<string, TechnicalIndicators> = {};
    lines.forEach((line) => {
      initialIndicators[line.id] = {
        sma20: false,
        sma50: false,
        sma200: false,
        ema20: false,
        ema50: false,
        bollingerBands: false,
      };
    });
    return initialIndicators;
  });

  // Update internal state when lines prop changes
  useEffect(() => {
    setInternalLines(lines);

    // Initialize indicators for any new lines
    setIndicators((prev) => {
      const updated = { ...prev };
      lines.forEach((line) => {
        if (!updated[line.id]) {
          updated[line.id] = {
            sma20: false,
            sma50: false,
            sma200: false,
            ema20: false,
            ema50: false,
            bollingerBands: false,
          };
        }
      });
      return updated;
    });
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
    const allLines = internalLines.filter((line) => line.data.length > 0);
    if (allLines.length === 0) return null;

    const allDates = allLines.flatMap((line) => line.data.map((d) => d.date));
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
    const allDates = visibleLines.flatMap((line) => line.data.map((d) => d.date));
    const latestDate = d3.max(allDates) || new Date();
    const startDate = getDateRangeStart(latestDate, selectedDateRange);

    return visibleLines.map((line) => ({
      ...line,
      data: line.data.filter((d) => d.date >= startDate),
    }));
  }, [internalLines, selectedDateRange]);

  // Calculate technical indicators for each visible line
  const indicatorData = useMemo(() => {
    if (filteredLines.length === 0) return {};

    const allIndicators: Record<
      string,
      {
        sma20: ReturnType<typeof calculateSMA> | null;
        sma50: ReturnType<typeof calculateSMA> | null;
        sma200: ReturnType<typeof calculateSMA> | null;
        ema20: ReturnType<typeof calculateEMA> | null;
        ema50: ReturnType<typeof calculateEMA> | null;
        bollingerBands: ReturnType<typeof calculateBollingerBands> | null;
      }
    > = {};

    filteredLines.forEach((line) => {
      const lineIndicators = indicators[line.id];
      if (!lineIndicators) return;

      allIndicators[line.id] = {
        sma20: lineIndicators.sma20 ? calculateSMA(line.data, 20) : null,
        sma50: lineIndicators.sma50 ? calculateSMA(line.data, 50) : null,
        sma200: lineIndicators.sma200 ? calculateSMA(line.data, 200) : null,
        ema20: lineIndicators.ema20 ? calculateEMA(line.data, 20) : null,
        ema50: lineIndicators.ema50 ? calculateEMA(line.data, 50) : null,
        bollingerBands: lineIndicators.bollingerBands ? calculateBollingerBands(line.data) : null,
      };
    });

    return allIndicators;
  }, [filteredLines, indicators]);

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear previous render
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current);
    const innerWidth = width - margins.left - margins.right;
    const innerHeight = height - margins.top - margins.bottom;

    // Create main group
    const g = svg.append('g').attr('transform', `translate(${margins.left},${margins.top})`);

    if (filteredLines.length === 0 || filteredLines.every((line) => line.data.length === 0)) {
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

    // Store xScale in ref for use in click handlers
    xScaleRef.current = xScale;

    const yScale = d3
      .scaleLinear()
      .domain([d3.min(allData, (d) => d.value)! * 0.95, d3.max(allData, (d) => d.value)! * 1.05])
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
        .line<(typeof line.data)[0]>()
        .x((d) => xScale(d.date))
        .y((d) => yScale(d.value))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(line.data)
        .attr('class', `line line-${line.id}`)
        .attr('d', lineGenerator)
        .attr('stroke', line.color)
        .attr('fill', 'none')
        .style('pointer-events', 'none');
    });

    // Draw technical indicators for each line
    filteredLines.forEach((line) => {
      const lineIndicatorData = indicatorData[line.id];
      if (!lineIndicatorData) return;

      const lineGen = d3
        .line<{ date: Date; value: number }>()
        .x((d) => xScale(d.date))
        .y((d) => yScale(d.value))
        .curve(d3.curveMonotoneX);

      // Helper function to lighten/darken color based on line color
      const getIndicatorColor = (baseColor: string, type: 'sma' | 'ema' | 'bb'): string => {
        // For now, use variations of the line color
        // Could be enhanced with actual color manipulation
        return line.color;
      };

      // Draw Bollinger Bands (fill first, then lines)
      if (lineIndicatorData.bollingerBands) {
        const bbData = lineIndicatorData.bollingerBands;

        // Area between upper and lower bands
        const area = d3
          .area<(typeof bbData)[0]>()
          .x((d) => xScale(d.date))
          .y0((d) => yScale(d.lower))
          .y1((d) => yScale(d.upper))
          .curve(d3.curveMonotoneX);

        g.append('path')
          .datum(bbData)
          .attr('class', `bollinger-area bollinger-${line.id}`)
          .attr('d', area)
          .attr('fill', line.color)
          .attr('opacity', 0.1)
          .style('pointer-events', 'none');

        // Create line generators for each band
        const upperLineGen = d3
          .line<(typeof bbData)[0]>()
          .x((d) => xScale(d.date))
          .y((d) => yScale(d.upper))
          .curve(d3.curveMonotoneX);

        const lowerLineGen = d3
          .line<(typeof bbData)[0]>()
          .x((d) => xScale(d.date))
          .y((d) => yScale(d.lower))
          .curve(d3.curveMonotoneX);

        const middleLineGen = d3
          .line<(typeof bbData)[0]>()
          .x((d) => xScale(d.date))
          .y((d) => yScale(d.middle))
          .curve(d3.curveMonotoneX);

        // Upper band line
        g.append('path')
          .datum(bbData)
          .attr('class', `bollinger-upper bollinger-upper-${line.id}`)
          .attr('d', upperLineGen)
          .attr('stroke', line.color)
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '4,4')
          .attr('fill', 'none')
          .attr('opacity', 0.5)
          .style('pointer-events', 'none');

        // Lower band line
        g.append('path')
          .datum(bbData)
          .attr('class', `bollinger-lower bollinger-lower-${line.id}`)
          .attr('d', lowerLineGen)
          .attr('stroke', line.color)
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '4,4')
          .attr('fill', 'none')
          .attr('opacity', 0.5)
          .style('pointer-events', 'none');

        // Middle band (SMA 20)
        g.append('path')
          .datum(bbData)
          .attr('class', `bollinger-middle bollinger-middle-${line.id}`)
          .attr('d', middleLineGen)
          .attr('stroke', line.color)
          .attr('stroke-width', 1)
          .attr('fill', 'none')
          .attr('opacity', 0.6)
          .style('pointer-events', 'none');
      }

      // Draw SMA lines
      if (lineIndicatorData.sma20) {
        g.append('path')
          .datum(lineIndicatorData.sma20)
          .attr('class', `indicator-sma20 indicator-sma20-${line.id}`)
          .attr('d', lineGen)
          .attr('stroke', line.color)
          .attr('stroke-width', 1.5)
          .attr('fill', 'none')
          .attr('opacity', 0.6)
          .style('pointer-events', 'none');
      }

      if (lineIndicatorData.sma50) {
        g.append('path')
          .datum(lineIndicatorData.sma50)
          .attr('class', `indicator-sma50 indicator-sma50-${line.id}`)
          .attr('d', lineGen)
          .attr('stroke', line.color)
          .attr('stroke-width', 1.5)
          .attr('fill', 'none')
          .attr('opacity', 0.6)
          .style('pointer-events', 'none');
      }

      if (lineIndicatorData.sma200) {
        g.append('path')
          .datum(lineIndicatorData.sma200)
          .attr('class', `indicator-sma200 indicator-sma200-${line.id}`)
          .attr('d', lineGen)
          .attr('stroke', line.color)
          .attr('stroke-width', 1.5)
          .attr('fill', 'none')
          .attr('opacity', 0.6)
          .style('pointer-events', 'none');
      }

      // Draw EMA lines (dashed)
      if (lineIndicatorData.ema20) {
        g.append('path')
          .datum(lineIndicatorData.ema20)
          .attr('class', `indicator-ema20 indicator-ema20-${line.id}`)
          .attr('d', lineGen)
          .attr('stroke', line.color)
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '5,3')
          .attr('fill', 'none')
          .attr('opacity', 0.6)
          .style('pointer-events', 'none');
      }

      if (lineIndicatorData.ema50) {
        g.append('path')
          .datum(lineIndicatorData.ema50)
          .attr('class', `indicator-ema50 indicator-ema50-${line.id}`)
          .attr('d', lineGen)
          .attr('stroke', line.color)
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '5,3')
          .attr('fill', 'none')
          .attr('opacity', 0.6)
          .style('pointer-events', 'none');
      }
    });

    // Min/max annotations removed - use custom annotations instead

    // Get domain for filtering annotations and reference lines
    const [domainMinDate, domainMaxDate] = xScale.domain();

    // Add custom annotations (filter by visible date range)
    customAnnotations
      .filter((annotation) => annotation.date >= domainMinDate && annotation.date <= domainMaxDate)
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

    // Draw reference point line if set
    if (
      referencePoint &&
      referencePoint.date >= domainMinDate &&
      referencePoint.date <= domainMaxDate
    ) {
      const xPos = xScale(referencePoint.date);
      g.append('line')
        .attr('class', 'reference-point-line')
        .attr('x1', xPos)
        .attr('y1', 0)
        .attr('x2', xPos)
        .attr('y2', innerHeight)
        .attr('stroke', '#e74c3c')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '8,4')
        .style('pointer-events', 'none');
      // Label below the button

      g.append('text')
        .attr('class', 'reference-point-label')
        .attr('x', xPos)
        .attr('y', 18)
        .attr('fill', '#e74c3c')
        .attr('font-weight', '600')
        .attr('font-size', '11px')
        .attr('text-anchor', 'middle')
        .text('REF')
        .style('pointer-events', 'none');
    }

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
      .call(
        d3.axisLeft(yScale).tickFormat((d) => {
          // Format numbers without unnecessary decimals
          const num = d as number;
          return num % 1 === 0 ? d3.format(',')(num) : d3.format(',.2f')(num);
        })
      );

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

    // Add container for snap point indicators
    const snapPointsGroup = g
      .append('g')
      .attr('class', 'snap-points-group')
      .style('display', 'none');

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
        snapPointsGroup.style('display', 'none');
        setTooltip(null);
        return;
      }

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
            point: nearestPoint,
          };
        })
        .filter((v): v is NonNullable<typeof v> => v !== null);

      if (tooltipValues.length > 0) {
        // Get the first line's nearest point to snap the vertical crosshair
        const firstLine = filteredLines[0];
        const snapPoint = findNearestPoint(firstLine, hoveredDate);

        if (snapPoint) {
          const snapX = xScale(snapPoint.date);

          // Show and position crosshair
          // Vertical crosshair (x) snaps to nearest point, horizontal crosshair (y) follows mouse
          crosshairGroup.style('display', null);
          crosshairGroup.select('.crosshair-x').attr('x1', snapX).attr('x2', snapX);
          crosshairGroup.select('.crosshair-y').attr('y1', chartY).attr('y2', chartY);

          // Update snap point indicators
          snapPointsGroup.style('display', null);

          // Clear existing snap points
          snapPointsGroup.selectAll('circle').remove();

          // Add snap point indicators for each line
          tooltipValues.forEach((val) => {
            const pointX = xScale(val.point.date);
            const pointY = yScale(val.point.value);

            snapPointsGroup
              .append('circle')
              .attr('cx', pointX)
              .attr('cy', pointY)
              .attr('r', 4)
              .attr('fill', val.color)
              .attr('stroke', 'white')
              .attr('stroke-width', 2)
              .style('pointer-events', 'none');
          });

          // Find nearby custom annotations (within 2 days of hovered date)
          const nearbyAnnotations: string[] = [];
          const toleranceDays = 2;
          customAnnotations.forEach((annotation) => {
            const daysDiff = Math.abs(
              (snapPoint.date.getTime() - annotation.date.getTime()) / (1000 * 60 * 60 * 24)
            );
            if (daysDiff <= toleranceDays) {
              nearbyAnnotations.push(annotation.label);
            }
          });

          // Find nearby reference lines (vertical ones within 2 days)
          const nearbyReferenceLines: string[] = [];
          referenceLines.forEach((refLine) => {
            if (refLine.type === 'vertical') {
              const refDate = refLine.value as Date;
              const daysDiff = Math.abs(
                (snapPoint.date.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24)
              );
              if (daysDiff <= toleranceDays) {
                nearbyReferenceLines.push(refLine.label);
              }
            }
          });

          setTooltip({
            date: snapPoint.date,
            values: tooltipValues.map((v) => {
              let relativeValue: number | undefined;
              let relativePercent: number | undefined;

              if (referencePoint && referencePoint.values.has(v.lineId)) {
                const refValue = referencePoint.values.get(v.lineId)!;
                relativeValue = v.value - refValue;
                relativePercent = ((v.value - refValue) / refValue) * 100;
              }

              return {
                lineId: v.lineId,
                lineName: v.lineName,
                value: v.value,
                color: v.color,
                relativeValue,
                relativePercent,
              };
            }),
            annotations: nearbyAnnotations.length > 0 ? nearbyAnnotations : undefined,
            referenceLines: nearbyReferenceLines.length > 0 ? nearbyReferenceLines : undefined,
            x: mouseX,
            y: mouseY,
          });
        }
      }
    };

    // Mouse leave handler
    const handleMouseLeave = () => {
      crosshairGroup.style('display', 'none');
      snapPointsGroup.style('display', 'none');
      setTooltip(null);
    };


    // Add invisible background rect to capture all mouse events
    svg
      .insert('rect', ':first-child')
      .attr('class', 'chart-background')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'transparent')
      .attr('pointer-events', 'all');

    // Ensure SVG captures all pointer events
    svg
      .style('cursor', 'crosshair')
      .style('pointer-events', 'all');

    // Attach event listeners directly to SVG
    svg
      .on('mouseenter', handleMouseMove)
      .on('mousemove', handleMouseMove)
      .on('mouseleave', handleMouseLeave);
  }, [
    filteredLines,
    width,
    height,
    margins,
    showMinMaxAnnotations,
    customAnnotations,
    referenceLines,
    referencePoint,
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

  const handleIndicatorToggle = (lineId: string, indicatorKey: keyof TechnicalIndicators) => {
    setIndicators((prev) => ({
      ...prev,
      [lineId]: {
        ...prev[lineId],
        [indicatorKey]: !prev[lineId]?.[indicatorKey],
      },
    }));
  };

  const handleGlobalIndicatorToggle = (indicatorKey: keyof TechnicalIndicators) => {
    // Check if any line has this indicator enabled
    const anyEnabled = Object.values(indicators).some(
      (lineIndicators) => lineIndicators[indicatorKey]
    );

    // Toggle all lines to the opposite state
    setIndicators((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((lineId) => {
        updated[lineId] = {
          ...updated[lineId],
          [indicatorKey]: !anyEnabled,
        };
      });
      return updated;
    });
  };

  const isGlobalIndicatorEnabled = (indicatorKey: keyof TechnicalIndicators): boolean => {
    return Object.values(indicators).some((lineIndicators) => lineIndicators[indicatorKey]);
  };

  // Legend drag handlers
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (!legendRef.current || !containerRef.current || !svgRef.current) return;

      const target = e.target as HTMLElement;

      // Check if clicking on the drag handle to start legend dragging
      const dragHandle = target.closest('[data-drag-handle]');
      if (dragHandle && legendRef.current.contains(dragHandle as Node)) {
        e.preventDefault();

        dragStateRef.current = {
          isDragging: true,
          startX: e.clientX,
          startY: e.clientY,
          initialPosX: legendPosition.x,
          initialPosY: legendPosition.y,
        };

        setIsDragging(true);
        return;
      }

      // Check if clicking on the SVG chart (not on legend) to set reference point
      const svgElement = svgRef.current;
      if (svgElement && (svgElement === target || svgElement.contains(target))) {
        // Get click position relative to SVG
        const svgRect = svgElement.getBoundingClientRect();
        const mouseX = e.clientX - svgRect.left;
        const chartX = mouseX - margins.left;

        // Only process if within X bounds
        if (chartX >= 0 && chartX <= innerWidth && xScaleRef.current) {
          // Use the same xScale that was used to draw the chart
          const xScale = xScaleRef.current;

          // Check if clicking near existing reference line (within 5px) - if so, remove it
          if (referencePoint) {
            const refLineX = xScale(referencePoint.date);
            const clickDistance = Math.abs(chartX - refLineX);

            if (clickDistance <= 5) {
              setReferencePoint(null);
              return;
            }
          }

          const clickedDate = xScale.invert(chartX);

          // Find nearest data points for all visible lines at this date
          const valuesAtDate = new Map<string, number>();
          filteredLines.forEach((line) => {
            if (line.data.length === 0) return;

            const bisector = d3.bisector<StockDataPoint, Date>((d) => d.date).left;
            const index = bisector(line.data, clickedDate);

            let nearestPoint: StockDataPoint | null = null;
            if (index === 0) {
              nearestPoint = line.data[0];
            } else if (index >= line.data.length) {
              nearestPoint = line.data[line.data.length - 1];
            } else {
              const leftPoint = line.data[index - 1];
              const rightPoint = line.data[index];
              nearestPoint =
                Math.abs(clickedDate.getTime() - leftPoint.date.getTime()) <
                Math.abs(clickedDate.getTime() - rightPoint.date.getTime())
                  ? leftPoint
                  : rightPoint;
            }

            if (nearestPoint) {
              valuesAtDate.set(line.id, nearestPoint.value);
            }
          });

          if (valuesAtDate.size > 0) {
            setReferencePoint({
              date: clickedDate,
              values: valuesAtDate,
            });
          }
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStateRef.current.isDragging || !containerRef.current || !legendRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const legendRect = legendRef.current.getBoundingClientRect();

      const deltaX = e.clientX - dragStateRef.current.startX;
      const deltaY = e.clientY - dragStateRef.current.startY;

      let newX = dragStateRef.current.initialPosX + deltaX;
      let newY = dragStateRef.current.initialPosY + deltaY;

      // Constrain to container bounds
      newX = Math.max(0, Math.min(newX, containerRect.width - legendRect.width));
      newY = Math.max(0, Math.min(newY, containerRect.height - legendRect.height));

      setLegendPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      if (dragStateRef.current.isDragging) {
        dragStateRef.current.isDragging = false;
        setIsDragging(false);
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [legendPosition, filteredLines, margins, innerWidth, referencePoint]);

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
          <div className={styles.tooltipDate}>{d3.timeFormat('%b %d, %Y')(tooltip.date)}</div>
          {tooltip.values.map((val) => (
            <div key={val.lineId} className={styles.tooltipLine}>
              <div className={styles.tooltipLineName}>
                <div className={styles.tooltipColorDot} style={{ backgroundColor: val.color }} />
                <span className={styles.tooltipLabel}>{val.lineName}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span className={styles.tooltipValue}>${val.value.toFixed(2)}</span>
                {val.relativePercent !== undefined && (
                  <span
                    className={styles.tooltipRelative}
                    style={{
                      color: val.relativePercent >= 0 ? '#27ae60' : '#e74c3c',
                      fontSize: '11px',
                      fontWeight: 600,
                    }}
                  >
                    {val.relativePercent >= 0 ? '+' : ''}
                    {val.relativePercent.toFixed(2)}%
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Show annotations if any are nearby */}
          {tooltip.annotations && tooltip.annotations.length > 0 && (
            <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #eee' }}>
              {tooltip.annotations.map((annotation, idx) => (
                <div key={idx} style={{ fontSize: '11px', color: '#666', marginBottom: '2px' }}>
                  📍 {annotation}
                </div>
              ))}
            </div>
          )}

          {/* Show reference lines if any are nearby */}
          {tooltip.referenceLines && tooltip.referenceLines.length > 0 && (
            <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #eee' }}>
              {tooltip.referenceLines.map((refLine, idx) => (
                <div key={idx} style={{ fontSize: '11px', color: '#666', marginBottom: '2px' }}>
                  📅 {refLine}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Legend and Date Range Selector */}
      <div
        ref={legendRef}
        className={`${styles.legend} ${isDragging ? styles.dragging : ''} ${isMinimized ? styles.minimized : ''}`}
        style={{
          left: legendPosition.x,
          top: legendPosition.y,
        }}
      >
        {/* Drag handle */}
        <div className={styles.dragHandle} data-drag-handle>
          <div className={styles.dragHandleContent}>
            <IconGripHorizontal size={16} className={styles.gripIcon} />
            <span className={styles.legendHeaderText}>Legend</span>
          </div>
          <ActionIcon
            variant="subtle"
            color="gray"
            size="sm"
            className={styles.minimizeButton}
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(!isMinimized);
            }}
            title={isMinimized ? 'Expand legend' : 'Minimize legend'}
          >
            {isMinimized ? <IconChevronDown size={14} /> : <IconMinus size={14} />}
          </ActionIcon>
        </div>

        {/* Legend content - only when expanded */}
        {!isMinimized && (
          <>
            {/* Global Indicators Menu */}
            <div className={styles.legendSection}>
              <div className={styles.legendItemContainer}>
                <div className={styles.legendTitle}>Indicators</div>
                <Menu shadow="md" width={200} position="bottom-start" closeOnItemClick={false}>
                  <Menu.Target>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="sm"
                      title="Toggle indicators for all lines"
                    >
                      <IconChartLine size={16} />
                    </ActionIcon>
                  </Menu.Target>

                  <Menu.Dropdown>
                    <Menu.Label>Apply to All Lines</Menu.Label>

                    <Menu.Item
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGlobalIndicatorToggle('sma20');
                      }}
                      leftSection={
                        <input
                          type="checkbox"
                          checked={isGlobalIndicatorEnabled('sma20')}
                          onChange={() => {}}
                          style={{ pointerEvents: 'none' }}
                        />
                      }
                    >
                      SMA 20
                    </Menu.Item>

                    <Menu.Item
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGlobalIndicatorToggle('sma50');
                      }}
                      leftSection={
                        <input
                          type="checkbox"
                          checked={isGlobalIndicatorEnabled('sma50')}
                          onChange={() => {}}
                          style={{ pointerEvents: 'none' }}
                        />
                      }
                    >
                      SMA 50
                    </Menu.Item>

                    <Menu.Item
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGlobalIndicatorToggle('sma200');
                      }}
                      leftSection={
                        <input
                          type="checkbox"
                          checked={isGlobalIndicatorEnabled('sma200')}
                          onChange={() => {}}
                          style={{ pointerEvents: 'none' }}
                        />
                      }
                    >
                      SMA 200
                    </Menu.Item>

                    <Menu.Divider />

                    <Menu.Item
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGlobalIndicatorToggle('ema20');
                      }}
                      leftSection={
                        <input
                          type="checkbox"
                          checked={isGlobalIndicatorEnabled('ema20')}
                          onChange={() => {}}
                          style={{ pointerEvents: 'none' }}
                        />
                      }
                    >
                      EMA 20
                    </Menu.Item>

                    <Menu.Item
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGlobalIndicatorToggle('ema50');
                      }}
                      leftSection={
                        <input
                          type="checkbox"
                          checked={isGlobalIndicatorEnabled('ema50')}
                          onChange={() => {}}
                          style={{ pointerEvents: 'none' }}
                        />
                      }
                    >
                      EMA 50
                    </Menu.Item>

                    <Menu.Divider />

                    <Menu.Item
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGlobalIndicatorToggle('bollingerBands');
                      }}
                      leftSection={
                        <input
                          type="checkbox"
                          checked={isGlobalIndicatorEnabled('bollingerBands')}
                          onChange={() => {}}
                          style={{ pointerEvents: 'none' }}
                        />
                      }
                    >
                      Bollinger Bands
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </div>

              {/* Reference Point Control */}
              {referencePoint && (
                <div
                  className={styles.legendItemContainer}
                  style={{ paddingTop: '8px', borderTop: '1px solid #eee' }}
                >
                  <div className={styles.legendItem} style={{ cursor: 'default', opacity: 0.9 }}>
                    <svg width="16" height="16" style={{ marginRight: '8px', flexShrink: 0 }}>
                      <line
                        x1="0"
                        y1="8"
                        x2="16"
                        y2="8"
                        stroke="#e74c3c"
                        strokeWidth="2"
                        strokeDasharray="4,2"
                      />
                    </svg>
                    <div className={styles.legendLabel} style={{ fontSize: '12px' }}>
                      Ref: {d3.timeFormat('%b %d, %Y')(referencePoint.date)}
                    </div>
                  </div>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    size="sm"
                    onClick={() => setReferencePoint(null)}
                    title="Clear reference point"
                  >
                    <IconX size={16} />
                  </ActionIcon>
                </div>
              )}

              {/* Line items */}
              {internalLines.map((line) => {
                const lineIndicators = indicators[line.id] || {};
                const hasActiveIndicators = Object.values(lineIndicators).some((v) => v);

                return (
                  <div key={line.id} className={styles.legendItemContainer}>
                    <div
                      className={`${styles.legendItem} ${!line.visible ? styles.disabled : ''}`}
                      onClick={() => handleLineToggle(line.id)}
                    >
                      <div
                        className={styles.legendColorBox}
                        style={{ backgroundColor: line.color }}
                      />
                      <div className={styles.legendLabel}>{line.name}</div>
                    </div>

                    <Menu shadow="md" width={200} position="right-start" closeOnItemClick={false}>
                      <Menu.Target>
                        <ActionIcon
                          variant={hasActiveIndicators ? 'filled' : 'subtle'}
                          color={hasActiveIndicators ? 'blue' : 'gray'}
                          size="sm"
                          className={styles.indicatorMenuButton}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <IconChartLine size={16} />
                        </ActionIcon>
                      </Menu.Target>

                      <Menu.Dropdown>
                        <Menu.Label>Technical Indicators</Menu.Label>

                        <Menu.Item
                          onClick={(e) => {
                            e.stopPropagation();
                            handleIndicatorToggle(line.id, 'sma20');
                          }}
                          leftSection={
                            <input
                              type="checkbox"
                              checked={lineIndicators.sma20 || false}
                              onChange={() => {}}
                              style={{ pointerEvents: 'none' }}
                            />
                          }
                        >
                          SMA 20
                        </Menu.Item>

                        <Menu.Item
                          onClick={(e) => {
                            e.stopPropagation();
                            handleIndicatorToggle(line.id, 'sma50');
                          }}
                          leftSection={
                            <input
                              type="checkbox"
                              checked={lineIndicators.sma50 || false}
                              onChange={() => {}}
                              style={{ pointerEvents: 'none' }}
                            />
                          }
                        >
                          SMA 50
                        </Menu.Item>

                        <Menu.Item
                          onClick={(e) => {
                            e.stopPropagation();
                            handleIndicatorToggle(line.id, 'sma200');
                          }}
                          leftSection={
                            <input
                              type="checkbox"
                              checked={lineIndicators.sma200 || false}
                              onChange={() => {}}
                              style={{ pointerEvents: 'none' }}
                            />
                          }
                        >
                          SMA 200
                        </Menu.Item>

                        <Menu.Divider />

                        <Menu.Item
                          onClick={(e) => {
                            e.stopPropagation();
                            handleIndicatorToggle(line.id, 'ema20');
                          }}
                          leftSection={
                            <input
                              type="checkbox"
                              checked={lineIndicators.ema20 || false}
                              onChange={() => {}}
                              style={{ pointerEvents: 'none' }}
                            />
                          }
                        >
                          EMA 20
                        </Menu.Item>

                        <Menu.Item
                          onClick={(e) => {
                            e.stopPropagation();
                            handleIndicatorToggle(line.id, 'ema50');
                          }}
                          leftSection={
                            <input
                              type="checkbox"
                              checked={lineIndicators.ema50 || false}
                              onChange={() => {}}
                              style={{ pointerEvents: 'none' }}
                            />
                          }
                        >
                          EMA 50
                        </Menu.Item>

                        <Menu.Divider />

                        <Menu.Item
                          onClick={(e) => {
                            e.stopPropagation();
                            handleIndicatorToggle(line.id, 'bollingerBands');
                          }}
                          leftSection={
                            <input
                              type="checkbox"
                              checked={lineIndicators.bollingerBands || false}
                              onChange={() => {}}
                              style={{ pointerEvents: 'none' }}
                            />
                          }
                        >
                          Bollinger Bands
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </div>
                );
              })}
            </div>

            {/* Time Range Selector */}
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
          </>
        )}
      </div>
    </div>
  );
};
