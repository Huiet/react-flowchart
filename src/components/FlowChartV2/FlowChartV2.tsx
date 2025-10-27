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

  // Helper function to check if a horizontal line segment intersects with a node
  const horizontalSegmentIntersectsNode = (
    y: number,
    x1: number,
    x2: number,
    node: PositionedNode
  ): boolean => {
    const buffer = 25 * finalScale; // Much larger buffer for safety
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);

    // Check if line's Y is within node's Y range (with buffer)
    if (y < node.y - buffer || y > node.y + node.height + buffer) {
      return false;
    }

    // Check if line's X range overlaps with node's X range (with buffer)
    if (maxX < node.x - buffer || minX > node.x + node.width + buffer) {
      return false;
    }

    return true;
  };

  // Helper function to check if a vertical line segment intersects with a node
  const verticalSegmentIntersectsNode = (
    x: number,
    y1: number,
    y2: number,
    node: PositionedNode
  ): boolean => {
    const buffer = 25 * finalScale; // Much larger buffer for safety
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    // Check if line's X is within node's X range (with buffer)
    if (x < node.x - buffer || x > node.x + node.width + buffer) {
      return false;
    }

    // Check if line's Y range overlaps with node's Y range (with buffer)
    if (maxY < node.y - buffer || minY > node.y + node.height + buffer) {
      return false;
    }

    return true;
  };

  // Find a safe horizontal corridor between nodes - simpler version
  const findSafeHorizontalY = (
    x1: number,
    x2: number,
    preferredY: number,
    otherNodes: PositionedNode[]
  ): number => {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);

    // Try the preferred Y first
    if (!otherNodes.some(node => horizontalSegmentIntersectsNode(preferredY, minX, maxX, node))) {
      return preferredY;
    }

    // Try above and below each node systematically
    const testOffsets = [-50, 50, -100, 100, -150, 150];
    for (const offset of testOffsets) {
      const testY = preferredY + offset * finalScale;
      if (!otherNodes.some(node => horizontalSegmentIntersectsNode(testY, minX, maxX, node))) {
        return testY;
      }
    }

    return preferredY; // Fallback
  };

  // Find a safe vertical corridor between nodes - simpler version
  const findSafeVerticalX = (
    y1: number,
    y2: number,
    preferredX: number,
    otherNodes: PositionedNode[]
  ): number => {
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    // Try the preferred X first
    if (!otherNodes.some(node => verticalSegmentIntersectsNode(preferredX, minY, maxY, node))) {
      return preferredX;
    }

    // Try left and right of each node systematically
    const testOffsets = [-50, 50, -100, 100, -150, 150];
    for (const offset of testOffsets) {
      const testX = preferredX + offset * finalScale;
      if (!otherNodes.some(node => verticalSegmentIntersectsNode(testX, minY, maxY, node))) {
        return testX;
      }
    }

    return preferredX; // Fallback
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

          // Calculate a deterministic offset for this connection to prevent overlapping parallel lines
          // Use a simple hash of the connection to get a consistent offset
          const connectionHash = (from.node.id + to.node.id + index).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const offsetAmount = 4 * finalScale; // 4px offset increments
          const corridorOffset = ((connectionHash % 5) - 2) * offsetAmount; // Range: -8px to +8px

          // Create arrow path with minimum travel distance in exit direction
          // Base minimum is 8px, but we add the absolute value of offset to create gaps between arrows
          const baseMinDistance = 8 * finalScale;
          const exitDistance = baseMinDistance + Math.abs(corridorOffset);
          const entryDistance = baseMinDistance + Math.abs(corridorOffset);

          let pathD = `M ${start.x} ${start.y} L ${end.x} ${end.y}`;

          // Calculate initial offset point based on exit side - MUST travel this distance perpendicular
          let firstPoint: { x: number; y: number };
          switch (fromSide) {
            case 'right':
              firstPoint = { x: start.x + exitDistance, y: start.y };
              break;
            case 'left':
              firstPoint = { x: start.x - exitDistance, y: start.y };
              break;
            case 'bottom':
              firstPoint = { x: start.x, y: start.y + exitDistance };
              break;
            case 'top':
              firstPoint = { x: start.x, y: start.y - exitDistance };
              break;
          }

          // Calculate approach point based on entry side - MUST approach from this direction
          let lastPoint: { x: number; y: number };
          switch (toSide) {
            case 'right':
              lastPoint = { x: end.x + entryDistance, y: end.y };
              break;
            case 'left':
              lastPoint = { x: end.x - entryDistance, y: end.y };
              break;
            case 'bottom':
              lastPoint = { x: end.x, y: end.y + entryDistance };
              break;
            case 'top':
              lastPoint = { x: end.x, y: end.y - entryDistance };
              break;
          }

          // Build path with Manhattan routing
          // EVERY path must: start → firstPoint (perpendicular exit) → routing → lastPoint (perpendicular entry) → end

          // Get list of nodes to avoid (all except source and destination)
          const otherNodes = layout.nodes.filter(
            (n) => n.node.id !== from.node.id && n.node.id !== to.node.id
          );

          // Determine routing based on exit and entry directions
          const exitVertical = fromSide === 'top' || fromSide === 'bottom';
          const entryVertical = toSide === 'top' || toSide === 'bottom';

          if (exitVertical && entryVertical) {
            // CASE 1: Vertical exit → Vertical entry (e.g., bottom → top, top → bottom)
            // Path: start → vertical to firstPoint → horizontal across → vertical to lastPoint → end
            // Apply offset at the corner points where direction changes
            const safeY = findSafeHorizontalY(start.x, end.x, firstPoint.y, otherNodes);
            const corner1Y = firstPoint.y + corridorOffset; // First corner after exit
            const corner2Y = safeY + corridorOffset; // Corridor segment
            pathD = `M ${start.x} ${start.y} L ${start.x} ${corner1Y} L ${start.x} ${corner2Y} L ${end.x} ${corner2Y} L ${end.x} ${lastPoint.y} L ${end.x} ${end.y}`;
          } else if (!exitVertical && !entryVertical) {
            // CASE 2: Horizontal exit → Horizontal entry (e.g., right → left, left → right)
            // Path: start → horizontal to firstPoint → vertical down/up → horizontal to lastPoint → end
            // Apply offset at the corner points where direction changes
            const safeX = findSafeVerticalX(start.y, end.y, firstPoint.x, otherNodes);
            const corner1X = firstPoint.x + corridorOffset; // First corner after exit
            const corner2X = safeX + corridorOffset; // Corridor segment
            pathD = `M ${start.x} ${start.y} L ${corner1X} ${start.y} L ${corner2X} ${start.y} L ${corner2X} ${end.y} L ${lastPoint.x} ${end.y} L ${end.x} ${end.y}`;
          } else if (exitVertical && !entryVertical) {
            // CASE 3: Vertical exit → Horizontal entry (e.g., bottom → left, top → right)
            // Path: start → vertical to firstPoint → horizontal across → horizontal to lastPoint → end
            // Apply offset at the corner points
            const safeY = findSafeHorizontalY(start.x, end.x, firstPoint.y, otherNodes);
            const corner1Y = firstPoint.y + corridorOffset;
            const corner2Y = safeY + corridorOffset;
            pathD = `M ${start.x} ${start.y} L ${start.x} ${corner1Y} L ${start.x} ${corner2Y} L ${end.x} ${corner2Y} L ${lastPoint.x} ${end.y} L ${end.x} ${end.y}`;
          } else {
            // CASE 4: Horizontal exit → Vertical entry (e.g., right → bottom, left → top)
            // Path: start → horizontal to firstPoint → vertical to safe corridor → horizontal to target X → vertical to lastPoint → end
            // Check if we need special routing to avoid passing through source node
            const exitingLeft = fromSide === 'left';
            const exitingRight = fromSide === 'right';
            const targetIsBelow = end.y > start.y;

            // If exiting left but target is to the right (or vice versa), route perpendicular first
            const needsSpecialRouting =
              (exitingLeft && end.x > start.x) ||
              (exitingRight && end.x < start.x);

            if (needsSpecialRouting) {
              // Go horizontal to firstPoint, then vertical to clear the node, then horizontal to target X, then vertical to lastPoint, then end
              const intermediateY = targetIsBelow
                ? from.y + from.height + 20 * finalScale
                : from.y - 20 * finalScale;
              const safeY = findSafeHorizontalY(firstPoint.x, end.x, intermediateY, otherNodes);
              const cornerY = safeY + corridorOffset;
              pathD = `M ${start.x} ${start.y} L ${firstPoint.x} ${start.y} L ${firstPoint.x} ${cornerY} L ${end.x} ${cornerY} L ${end.x} ${lastPoint.y} L ${end.x} ${end.y}`;
            } else {
              // Normal routing: start → horizontal to firstPoint → vertical → horizontal to target X → vertical to lastPoint → end
              // Need to find safe horizontal corridor to traverse to get to target X, then enter vertically
              const intermediateY = targetIsBelow
                ? Math.max(firstPoint.y, lastPoint.y) + 20 * finalScale
                : Math.min(firstPoint.y, lastPoint.y) - 20 * finalScale;
              const safeY = findSafeHorizontalY(firstPoint.x, end.x, intermediateY, otherNodes);
              const cornerY = safeY + corridorOffset;
              pathD = `M ${start.x} ${start.y} L ${firstPoint.x} ${start.y} L ${firstPoint.x} ${cornerY} L ${end.x} ${cornerY} L ${end.x} ${lastPoint.y} L ${end.x} ${end.y}`;
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

          // Calculate label position on the first segment after exit distance
          // Match the same logic as arrow paths for consistency
          const connectionHash = (from.node.id + to.node.id + index).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
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
