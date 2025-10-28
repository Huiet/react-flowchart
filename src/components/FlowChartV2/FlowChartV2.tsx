import React from 'react';
import { calculateLayout } from './layoutEngine';
import { Node } from './Node';
import type { ColumnPositions, FlowChartData, PositionedNode } from './types';

interface FlowChartV2Props {
  data: FlowChartData;
  title?: string;
  subtitle?: string;
  columnPositions?: Partial<ColumnPositions>;
  scale?: number;
  maxWidth?: number;
}

export const FlowChartV2: React.FC<FlowChartV2Props> = ({
  data,
  title,
  subtitle,
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
  const layout =
    finalScale !== 1
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
    const positionIndex =
      sideMap.get(key)?.findIndex((item) => item.index === connectionIndex) || 0;

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

  /**
   * Creates SVG for arrow, using the grid structure of the folwchart to avoid collisions with nodes and other arrows
   * @param start
   * @param end
   * @param fromNode
   * @param toNode
   * @param fromSide
   * @param toSide
   * @param corridorOffset
   * @param allNodes
   * @param scale
   */
  const calculateGridBasedPathForConnection = (
    start: { x: number; y: number },
    end: { x: number; y: number },
    fromNode: PositionedNode,
    toNode: PositionedNode,
    fromSide: 'top' | 'right' | 'bottom' | 'left',
    toSide: 'top' | 'right' | 'bottom' | 'left',
    corridorOffset: number,
    allNodes: PositionedNode[],
    scale: number
  ): string => {
    const minimumDistanceToNodeConnection = 8 * scale;
    const exitDistance = minimumDistanceToNodeConnection + Math.abs(corridorOffset);
    const entryDistance = minimumDistanceToNodeConnection + Math.abs(corridorOffset);

    // Calculate exit point (perpendicular from start)
    let exitPoint: { x: number; y: number };
    switch (fromSide) {
      case 'right':
        exitPoint = { x: start.x + exitDistance, y: start.y };
        break;
      case 'left':
        exitPoint = { x: start.x - exitDistance, y: start.y };
        break;
      case 'bottom':
        exitPoint = { x: start.x, y: start.y + exitDistance };
        break;
      case 'top':
        exitPoint = { x: start.x, y: start.y - exitDistance };
        break;
    }

    // Calculate entry point (perpendicular to end)
    let entryPoint: { x: number; y: number };
    switch (toSide) {
      case 'right':
        entryPoint = { x: end.x + entryDistance, y: end.y };
        break;
      case 'left':
        entryPoint = { x: end.x - entryDistance, y: end.y };
        break;
      case 'bottom':
        entryPoint = { x: end.x, y: end.y + entryDistance };
        break;
      case 'top':
        entryPoint = { x: end.x, y: end.y - entryDistance };
        break;
    }

    // Find all horizontal and vertical gutters
    const horizontalGutters = calculateHorizontalGutters(allNodes);
    const verticalGutters = calculateVerticalGutters(allNodes);

    // Determine if we're exiting/entering vertically or horizontally
    const exitVertical = fromSide === 'top' || fromSide === 'bottom';
    const entryVertical = toSide === 'top' || toSide === 'bottom';

    // Build path through gutters
    const pathSegments: { x: number; y: number }[] = [start, exitPoint];

    if (exitVertical && entryVertical) {
      // Vertical → Vertical: exit vertically, cross horizontally through gutter, enter vertically
      const gutterY =
        findBestHorizontalGutter(exitPoint.y, entryPoint.y, horizontalGutters, fromNode, toNode) +
        corridorOffset;
      pathSegments.push({ x: exitPoint.x, y: gutterY });
      pathSegments.push({ x: entryPoint.x, y: gutterY });
      pathSegments.push({ x: entryPoint.x, y: entryPoint.y });
    } else if (!exitVertical && !entryVertical) {
      // Horizontal → Horizontal: exit horizontally, cross vertically through gutter, enter horizontally
      const gutterX =
        findBestVerticalGutter(exitPoint.x, entryPoint.x, verticalGutters, fromNode, toNode) +
        corridorOffset;
      pathSegments.push({ x: gutterX, y: exitPoint.y });
      pathSegments.push({ x: gutterX, y: entryPoint.y });
      pathSegments.push({ x: entryPoint.x, y: entryPoint.y });
    } else if (exitVertical && !entryVertical) {
      // Vertical → Horizontal: exit vertically, cross horizontally, enter horizontally
      const gutterY =
        findBestHorizontalGutter(exitPoint.y, entryPoint.y, horizontalGutters, fromNode, toNode) +
        corridorOffset;
      pathSegments.push({ x: exitPoint.x, y: gutterY });
      pathSegments.push({ x: entryPoint.x, y: gutterY });
      pathSegments.push({ x: entryPoint.x, y: entryPoint.y });
    } else {
      // Horizontal → Vertical: exit horizontally, cross vertically, enter vertically
      const gutterY =
        findBestHorizontalGutter(exitPoint.y, entryPoint.y, horizontalGutters, fromNode, toNode) +
        corridorOffset;
      pathSegments.push({ x: exitPoint.x, y: gutterY });
      pathSegments.push({ x: entryPoint.x, y: gutterY });
      pathSegments.push({ x: entryPoint.x, y: entryPoint.y });
    }

    pathSegments.push(end);

    // Build SVG path string
    return pathSegments.map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  };

  // Calculate horizontal gutters (between rows of nodes)
  const calculateHorizontalGutters = (
    nodes: PositionedNode[]
  ): { top: number; bottom: number; center: number }[] => {
    const sortedByY = [...nodes].sort((a, b) => a.y - b.y);
    const gutters: { top: number; bottom: number; center: number }[] = [];

    for (let i = 0; i < sortedByY.length - 1; i++) {
      const top = sortedByY[i].y + sortedByY[i].height;
      const bottom = sortedByY[i + 1].y;
      if (bottom > top) {
        gutters.push({ top, bottom, center: (top + bottom) / 2 });
      }
    }

    return gutters;
  };

  // Calculate vertical gutters (between columns of nodes)
  const calculateVerticalGutters = (
    nodes: PositionedNode[]
  ): { left: number; right: number; center: number }[] => {
    const sortedByX = [...nodes].sort((a, b) => a.x - b.x);
    const gutters: { left: number; right: number; center: number }[] = [];

    for (let i = 0; i < sortedByX.length - 1; i++) {
      const left = sortedByX[i].x + sortedByX[i].width;
      const right = sortedByX[i + 1].x;
      if (right > left) {
        gutters.push({ left, right, center: (left + right) / 2 });
      }
    }

    return gutters;
  };

  // Find the best horizontal gutter for routing between two Y positions
  const findBestHorizontalGutter = (
    fromY: number,
    toY: number,
    gutters: { top: number; bottom: number; center: number }[],
    fromNode: PositionedNode,
    toNode: PositionedNode
  ): number => {
    // Find gutter between the two nodes
    const fromBottom = fromNode.y + fromNode.height;
    const toTop = toNode.y;

    // Find gutter that contains the space between nodes
    const targetGutter = gutters.find(
      (g) =>
        (g.top >= fromBottom && g.bottom <= toTop) ||
        (g.top <= fromBottom && g.bottom >= toTop) ||
        (fromBottom >= g.top && fromBottom <= g.bottom) ||
        (toTop >= g.top && toTop <= g.bottom)
    );

    if (targetGutter) {
      return targetGutter.center;
    }

    // Fallback: use midpoint
    return (fromY + toY) / 2;
  };

  // Find the best vertical gutter for routing between two X positions
  const findBestVerticalGutter = (
    fromX: number,
    toX: number,
    gutters: { left: number; right: number; center: number }[],
    fromNode: PositionedNode,
    toNode: PositionedNode
  ): number => {
    // Find gutter between the two nodes
    const fromRight = fromNode.x + fromNode.width;
    const toLeft = toNode.x;

    // Find gutter that contains the space between nodes
    const targetGutter = gutters.find(
      (g) =>
        (g.left >= fromRight && g.right <= toLeft) ||
        (g.left <= fromRight && g.right >= toLeft) ||
        (fromRight >= g.left && fromRight <= g.right) ||
        (toLeft >= g.left && toLeft <= g.right)
    );

    if (targetGutter) {
      return targetGutter.center;
    }

    // Fallback: use midpoint
    return (fromX + toX) / 2;
  };

  return (
    <div style={{ width: '100%', overflow: 'auto' }}>
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

          // Calculate a deterministic offset for this connection to prevent overlapping parallel lines
          const connectionHash = (from.node.id + to.node.id + index)
            .split('')
            .reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const offsetAmount = 4 * finalScale; // 4px offset increments
          const corridorOffset = ((connectionHash % 5) - 2) * offsetAmount; // Range: -8px to +8px

          const pathD = calculateGridBasedPathForConnection(
            start,
            end,
            from,
            to,
            fromSide,
            toSide,
            corridorOffset,
            layout.nodes,
            finalScale
          );

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

          // Calculate label position on the first segment after exit distance
          // Match the same logic as arrow paths for consistency
          const connectionHash = (from.node.id + to.node.id + index)
            .split('')
            .reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const offsetAmount = 4 * finalScale;
          const corridorOffset = ((connectionHash % 5) - 2) * offsetAmount;
          const baseMinDistance = 8 * finalScale;
          const exitDistance = baseMinDistance + Math.abs(corridorOffset);

          let labelPos: { x: number; y: number };

          // Place label on first segment (halfway through the exit distance)
          switch (fromSide) {
            case 'right':
              labelPos = { x: start.x + exitDistance / 2, y: start.y };
              break;
            case 'left':
              labelPos = { x: start.x - exitDistance / 2, y: start.y };
              break;
            case 'bottom':
              labelPos = { x: start.x, y: start.y + exitDistance / 2 };
              break;
            case 'top':
              labelPos = { x: start.x, y: start.y - exitDistance / 2 };
              break;
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
