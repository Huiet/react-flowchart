import React from 'react';
import type { FlowChartData, ColumnPositions, PositionedNode } from './types';
import { calculateLayout } from './layoutEngine';
import { Node } from './Node';

interface FlowChartV2Props {
  data: FlowChartData;
  title?: string;
  subtitle?: string;
  className?: string;
  columnPositions?: Partial<ColumnPositions>;
  scale?: number;
  maxWidth?: number;
}

export const FlowChartV2: React.FC<FlowChartV2Props> = ({
  data,
  title,
  subtitle,
  className = '',
  columnPositions,
  scale: providedScale,
  maxWidth,
}) => {
  // Calculate initial layout to determine natural width
  const initialLayout = calculateLayout(data, { scale: 1 }, columnPositions);

  // Calculate scale based on maxWidth if provided
  let finalScale = providedScale ?? 1;
  if (maxWidth && initialLayout.width > maxWidth) {
    finalScale = maxWidth / initialLayout.width;
  }

  // Recalculate layout with final scale
  const layout = finalScale !== 1
    ? calculateLayout(data, { scale: finalScale }, columnPositions)
    : initialLayout;

  // Calculate staggering data for connections
  const fromSideCounts = new Map<string, { side: string; count: number; index: number }[]>();
  const toSideCounts = new Map<string, { side: string; count: number; index: number }[]>();

  layout.connections.forEach((conn, idx) => {
    const fromKey = `${conn.from.node.id}-${conn.fromSide}`;
    const toKey = `${conn.to.node.id}-${conn.toSide}`;

    if (!fromSideCounts.has(fromKey)) {
      fromSideCounts.set(fromKey, []);
    }
    if (!toSideCounts.has(toKey)) {
      toSideCounts.set(toKey, []);
    }

    fromSideCounts.get(fromKey)!.push({ side: conn.fromSide, count: 0, index: idx });
    toSideCounts.get(toKey)!.push({ side: conn.toSide, count: 0, index: idx });
  });

  // Update counts
  fromSideCounts.forEach((arr) => {
    arr.forEach((item) => {
      item.count = arr.length;
    });
  });
  toSideCounts.forEach((arr) => {
    arr.forEach((item) => {
      item.count = arr.length;
    });
  });

  // Helper function to get staggered connection point
  const getStaggeredConnectionPoint = (
    node: PositionedNode,
    side: 'top' | 'right' | 'bottom' | 'left',
    isFrom: boolean,
    connectionIndex: number
  ) => {
    const key = `${node.node.id}-${side}`;
    const sideMap = isFrom ? fromSideCounts : toSideCounts;
    const sideInfo = sideMap.get(key)?.find((item) => item.index === connectionIndex);
    const count = sideInfo?.count || 1;
    const positionIndex = sideMap.get(key)?.findIndex((item) => item.index === connectionIndex) || 0;

    // Calculate offset for staggering
    const spacing = count > 1 ? 20 * finalScale : 0;
    const totalWidth = (count - 1) * spacing;
    const offset = positionIndex * spacing - totalWidth / 2;

    switch (side) {
      case 'top':
        return { x: node.x + node.width / 2 + offset, y: node.y };
      case 'right':
        return { x: node.x + node.width, y: node.y + node.height / 2 + offset };
      case 'bottom':
        return { x: node.x + node.width / 2 + offset, y: node.y + node.height };
      case 'left':
        return { x: node.x, y: node.y + node.height / 2 + offset };
    }
  };

  return (
    <div className={className} style={{ width: '100%', overflow: 'auto' }}>
      <svg
        width={layout.width}
        height={layout.height}
        xmlns="http://www.w3.org/2000/svg"
        style={{ minWidth: '100%' }}
      >
        {/* Define arrowhead markers for different colors */}
        <defs>
          {/* Default gray arrowhead */}
          <marker
            id="arrowhead-default"
            markerWidth={6 * finalScale}
            markerHeight={6 * finalScale}
            refX={5.5 * finalScale}
            refY={2.5 * finalScale}
            orient="auto"
          >
            <polygon
              points={`0 0.5, ${6 * finalScale} ${2.5 * finalScale}, 0 ${4.5 * finalScale}`}
              fill="#333333"
            />
          </marker>
          {/* Light gray arrowhead for inactive paths */}
          <marker
            id="arrowhead-inactive"
            markerWidth={6 * finalScale}
            markerHeight={6 * finalScale}
            refX={5.5 * finalScale}
            refY={2.5 * finalScale}
            orient="auto"
          >
            <polygon
              points={`0 0.5, ${6 * finalScale} ${2.5 * finalScale}, 0 ${4.5 * finalScale}`}
              fill="#cccccc"
            />
          </marker>
          {/* Green arrowhead for Yes paths */}
          <marker
            id="arrowhead-yes"
            markerWidth={6 * finalScale}
            markerHeight={6 * finalScale}
            refX={5.5 * finalScale}
            refY={2.5 * finalScale}
            orient="auto"
          >
            <polygon
              points={`0 0.5, ${6 * finalScale} ${2.5 * finalScale}, 0 ${4.5 * finalScale}`}
              fill="#4CAF50"
            />
          </marker>
          {/* Orange arrowhead for No paths */}
          <marker
            id="arrowhead-no"
            markerWidth={6 * finalScale}
            markerHeight={6 * finalScale}
            refX={5.5 * finalScale}
            refY={2.5 * finalScale}
            orient="auto"
          >
            <polygon
              points={`0 0.5, ${6 * finalScale} ${2.5 * finalScale}, 0 ${4.5 * finalScale}`}
              fill="#FF9800"
            />
          </marker>
          {/* Blue arrowhead for active non-labeled paths */}
          <marker
            id="arrowhead-active"
            markerWidth={6 * finalScale}
            markerHeight={6 * finalScale}
            refX={5.5 * finalScale}
            refY={2.5 * finalScale}
            orient="auto"
          >
            <polygon
              points={`0 0.5, ${6 * finalScale} ${2.5 * finalScale}, 0 ${4.5 * finalScale}`}
              fill="#2196F3"
            />
          </marker>
        </defs>

        {/* Header */}
        {(title || subtitle) && (
          <g>
            {title && (
              <text
                x={layout.width / 2}
                y={25 * finalScale}
                textAnchor="middle"
                fontSize={18 * finalScale}
                fontWeight="bold"
                fill="#1e3a5f"
                fontFamily="Arial, sans-serif"
              >
                {title}
              </text>
            )}
            {subtitle && (
              <text
                x={layout.width - 20 * finalScale}
                y={25 * finalScale}
                textAnchor="end"
                fontSize={12 * finalScale}
                fill="#666666"
                fontFamily="Arial, sans-serif"
              >
                {subtitle}
              </text>
            )}
            {/* Header underline */}
            <line
              x1={20 * finalScale}
              y1={40 * finalScale}
              x2={layout.width - 20 * finalScale}
              y2={40 * finalScale}
              stroke="#4a90e2"
              strokeWidth={3 * finalScale}
            />
          </g>
        )}

        {/* Render arrow lines first (behind everything) */}
        {layout.connections.map((connection, index) => {
          const { from, to, fromSide, toSide, isActive, label, color } = connection;

          const start = getStaggeredConnectionPoint(from, fromSide, true, index);
          const end = getStaggeredConnectionPoint(to, toSide, false, index);
          const midY = start.y + (end.y - start.y) / 2;
          const midX = start.x + (end.x - start.x) / 2;

          // Create arrow path with minimum travel distance in exit direction
          const minTravelDistance = 25 * finalScale; // Minimum distance to travel in exit direction
          let pathD = `M ${start.x} ${start.y} L ${end.x} ${end.y}`;

          // Calculate initial offset point based on exit side
          let firstPoint: { x: number; y: number };
          switch (fromSide) {
            case 'right':
              firstPoint = { x: start.x + minTravelDistance, y: start.y };
              break;
            case 'left':
              firstPoint = { x: start.x - minTravelDistance, y: start.y };
              break;
            case 'bottom':
              firstPoint = { x: start.x, y: start.y + minTravelDistance };
              break;
            case 'top':
              firstPoint = { x: start.x, y: start.y - minTravelDistance };
              break;
          }

          // Calculate approach point based on entry side
          let lastPoint: { x: number; y: number };
          switch (toSide) {
            case 'right':
              lastPoint = { x: end.x + minTravelDistance, y: end.y };
              break;
            case 'left':
              lastPoint = { x: end.x - minTravelDistance, y: end.y };
              break;
            case 'bottom':
              lastPoint = { x: end.x, y: end.y + minTravelDistance };
              break;
            case 'top':
              lastPoint = { x: end.x, y: end.y - minTravelDistance };
              break;
          }

          // Build path with Manhattan routing, avoiding 180-degree turns
          // Check if this is a 180-degree reversal case
          const is180Reversal =
            (fromSide === 'bottom' && toSide === 'top') ||
            (fromSide === 'top' && toSide === 'bottom') ||
            (fromSide === 'right' && toSide === 'left') ||
            (fromSide === 'left' && toSide === 'right');

          if (is180Reversal) {
            // For 180-degree cases, must go perpendicular before reversing
            if (fromSide === 'bottom' && toSide === 'top') {
              // Exit bottom, must go down, then horizontal, then up
              // Go down min distance, horizontally to target X, then up to target
              pathD = `M ${start.x} ${start.y} L ${start.x} ${firstPoint.y} L ${end.x} ${firstPoint.y} L ${end.x} ${lastPoint.y} L ${end.x} ${end.y}`;
            } else if (fromSide === 'top' && toSide === 'bottom') {
              // Exit top, must go up, then horizontal, then down
              pathD = `M ${start.x} ${start.y} L ${start.x} ${firstPoint.y} L ${end.x} ${firstPoint.y} L ${end.x} ${lastPoint.y} L ${end.x} ${end.y}`;
            } else if (fromSide === 'right' && toSide === 'left') {
              // Exit right, must go right, then vertical, then left
              pathD = `M ${start.x} ${start.y} L ${firstPoint.x} ${start.y} L ${firstPoint.x} ${end.y} L ${lastPoint.x} ${end.y} L ${end.x} ${end.y}`;
            } else if (fromSide === 'left' && toSide === 'right') {
              // Exit left, must go left, then vertical, then right
              pathD = `M ${start.x} ${start.y} L ${firstPoint.x} ${start.y} L ${firstPoint.x} ${end.y} L ${lastPoint.x} ${end.y} L ${end.x} ${end.y}`;
            }
          } else {
            // Non-180 cases - can go more directly
            if ((fromSide === 'bottom' || fromSide === 'top') && (toSide === 'left' || toSide === 'right')) {
              // Vertical exit to horizontal entry
              // Go vertical to target Y, then horizontal to target
              pathD = `M ${start.x} ${start.y} L ${start.x} ${end.y} L ${lastPoint.x} ${end.y} L ${end.x} ${end.y}`;
            } else if ((fromSide === 'left' || fromSide === 'right') && (toSide === 'top' || toSide === 'bottom')) {
              // Horizontal exit to vertical entry
              // Go horizontal to target X, then vertical to target
              pathD = `M ${start.x} ${start.y} L ${end.x} ${start.y} L ${end.x} ${lastPoint.y} L ${end.x} ${end.y}`;
            } else {
              // Same direction (e.g., bottom to bottom, right to right) - straight line
              pathD = `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
            }
          }

          // Determine arrow color and marker based on connection color and active state
          let arrowColor = '#333333';
          let arrowMarker = 'arrowhead-default';

          if (isActive) {
            // Use connection color if specified
            switch (color) {
              case 'green':
                arrowColor = '#4CAF50';
                arrowMarker = 'arrowhead-yes';
                break;
              case 'red':
                arrowColor = '#e74c3c';
                arrowMarker = 'arrowhead-no';
                break;
              case 'blue':
                arrowColor = '#2196F3';
                arrowMarker = 'arrowhead-active';
                break;
              case 'orange':
                arrowColor = '#FF9800';
                arrowMarker = 'arrowhead-no';
                break;
              default:
                arrowColor = '#2196F3';
                arrowMarker = 'arrowhead-active';
            }
          } else if (isActive === false) {
            // Explicitly inactive
            arrowColor = '#cccccc';
            arrowMarker = 'arrowhead-inactive';
          }

          // Calculate perpendicular line at start point (offset from node edge)
          const perpLength = 10 * finalScale;
          const offset = 3 * finalScale; // Offset from node edge so it's not covered
          let perpLine: { x1: number; y1: number; x2: number; y2: number } | null = null;

          switch (fromSide) {
            case 'right':
              // Vertical perpendicular line for right-exiting arrows
              perpLine = {
                x1: start.x + offset,
                y1: start.y - perpLength,
                x2: start.x + offset,
                y2: start.y + perpLength,
              };
              break;
            case 'left':
              // Vertical perpendicular line for left-exiting arrows
              perpLine = {
                x1: start.x - offset,
                y1: start.y - perpLength,
                x2: start.x - offset,
                y2: start.y + perpLength,
              };
              break;
            case 'bottom':
              // Horizontal perpendicular line for bottom-exiting arrows
              perpLine = {
                x1: start.x - perpLength,
                y1: start.y + offset,
                x2: start.x + perpLength,
                y2: start.y + offset,
              };
              break;
            case 'top':
              // Horizontal perpendicular line for top-exiting arrows
              perpLine = {
                x1: start.x - perpLength,
                y1: start.y - offset,
                x2: start.x + perpLength,
                y2: start.y - offset,
              };
              break;
          }

          return (
            <g key={`arrow-${index}`}>
              {/* Perpendicular start indicator */}
              {perpLine && (
                <line
                  x1={perpLine.x1}
                  y1={perpLine.y1}
                  x2={perpLine.x2}
                  y2={perpLine.y2}
                  stroke={arrowColor}
                  strokeWidth={2 * finalScale}
                  strokeLinecap="round"
                  opacity={0.8}
                />
              )}
              {/* Arrow path */}
              <path
                d={pathD}
                stroke={arrowColor}
                strokeWidth={2 * finalScale}
                fill="none"
                markerEnd={`url(#${arrowMarker})`}
              />
            </g>
          );
        })}

        {/* Render nodes */}
        {layout.nodes.map((positioned) => (
          <Node
            key={positioned.node.id}
            node={positioned.node}
            x={positioned.x}
            y={positioned.y}
            width={positioned.width}
            height={positioned.height}
            scale={finalScale}
          />
        ))}

        {/* Render connection labels on top of everything */}
        {layout.connections.map((connection, index) => {
          if (!connection.label) return null;

          const { from, to, label, fromSide, toSide, isActive, color } = connection;

          const start = getStaggeredConnectionPoint(from, fromSide, true, index);
          const end = getStaggeredConnectionPoint(to, toSide, false, index);

          // Calculate control points (same as arrow path logic)
          const minTravelDistance = 25 * finalScale;
          let firstPoint: { x: number; y: number };
          switch (fromSide) {
            case 'right':
              firstPoint = { x: start.x + minTravelDistance, y: start.y };
              break;
            case 'left':
              firstPoint = { x: start.x - minTravelDistance, y: start.y };
              break;
            case 'bottom':
              firstPoint = { x: start.x, y: start.y + minTravelDistance };
              break;
            case 'top':
              firstPoint = { x: start.x, y: start.y - minTravelDistance };
              break;
          }

          // Calculate label position based on path type
          let labelPos: { x: number; y: number };

          // Check if this is a 180-degree reversal
          const is180Reversal =
            (fromSide === 'bottom' && toSide === 'top') ||
            (fromSide === 'top' && toSide === 'bottom') ||
            (fromSide === 'right' && toSide === 'left') ||
            (fromSide === 'left' && toSide === 'right');

          if (is180Reversal) {
            // For 180-degree cases, place label on the horizontal/vertical crossover segment
            if (fromSide === 'bottom' && toSide === 'top') {
              // Label on horizontal segment at firstPoint.y
              labelPos = { x: (start.x + end.x) / 2, y: firstPoint.y };
            } else if (fromSide === 'top' && toSide === 'bottom') {
              labelPos = { x: (start.x + end.x) / 2, y: firstPoint.y };
            } else if (fromSide === 'right' && toSide === 'left') {
              // Label on vertical segment at firstPoint.x
              labelPos = { x: firstPoint.x, y: (start.y + end.y) / 2 };
            } else if (fromSide === 'left' && toSide === 'right') {
              labelPos = { x: firstPoint.x, y: (start.y + end.y) / 2 };
            } else {
              labelPos = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
            }
          } else {
            // Non-180 cases - place on first major segment
            if ((fromSide === 'bottom' || fromSide === 'top') && (toSide === 'left' || toSide === 'right')) {
              // Vertical to horizontal: label on vertical segment
              labelPos = { x: start.x, y: (start.y + end.y) / 2 };
            } else if ((fromSide === 'left' || fromSide === 'right') && (toSide === 'top' || toSide === 'bottom')) {
              // Horizontal to vertical: label on horizontal segment
              labelPos = { x: (start.x + end.x) / 2, y: start.y };
            } else {
              // Same direction or straight line
              labelPos = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
            }
          }

          // Determine circle color based on connection color and active state
          let circleColor = '#2196F3'; // default blue
          if (isActive === false) {
            // Use gray for inactive circles
            circleColor = '#9e9e9e';
          } else if (color) {
            // Map connection color to circle color
            switch (color) {
              case 'green':
                circleColor = '#4CAF50';
                break;
              case 'red':
                circleColor = '#e74c3c';
                break;
              case 'blue':
                circleColor = '#2196F3';
                break;
              case 'orange':
                circleColor = '#FF9800';
                break;
              default:
                circleColor = '#2196F3';
            }
          }

          return (
            <g key={`label-${index}`}>
              <circle
                cx={labelPos.x}
                cy={labelPos.y}
                r={15 * finalScale}
                fill={circleColor}
                stroke="none"
              />
              <text
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#ffffff"
                fontSize={11 * finalScale}
                fontWeight="bold"
                fontFamily="Arial, sans-serif"
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
