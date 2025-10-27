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
          const { from, to, fromSide, toSide, isActive, label } = connection;

          const start = getStaggeredConnectionPoint(from, fromSide, true, index);
          const end = getStaggeredConnectionPoint(to, toSide, false, index);
          const midY = start.y + (end.y - start.y) / 2;
          const midX = start.x + (end.x - start.x) / 2;

          // Create arrow path (same logic as Arrow component)
          let pathD = `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
          if (fromSide === 'bottom' && toSide === 'top') {
            if (Math.abs(start.x - end.x) >= 50) {
              const goingLeft = end.x < start.x;
              if (goingLeft) {
                const downY = midY;
                pathD = `M ${start.x} ${start.y} L ${start.x} ${downY} L ${end.x} ${downY} L ${end.x} ${end.y}`;
              } else {
                pathD = `M ${start.x} ${start.y} L ${start.x} ${midY} L ${end.x} ${midY} L ${end.x} ${end.y}`;
              }
            }
          } else if (fromSide === 'right' && toSide === 'left') {
            if (Math.abs(start.y - end.y) >= 50) {
              pathD = `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${end.y} L ${end.x} ${end.y}`;
            }
          } else if (fromSide === 'right' && toSide === 'top') {
            const offsetX = start.x + 40;
            const offsetY = end.y - 20;
            pathD = `M ${start.x} ${start.y} L ${offsetX} ${start.y} L ${end.x} ${offsetY} L ${end.x} ${end.y}`;
          } else if (fromSide === 'bottom' && toSide === 'left') {
            const offsetY = start.y + 30;
            pathD = `M ${start.x} ${start.y} L ${start.x} ${offsetY} L ${end.x} ${offsetY} L ${end.x} ${end.y}`;
          } else if (fromSide === 'left' && toSide === 'top') {
            // Go horizontally first, then vertically
            pathD = `M ${start.x} ${start.y} L ${end.x} ${start.y} L ${end.x} ${end.y}`;
          } else if (fromSide === 'bottom' && toSide === 'right') {
            const offsetY = start.y + 30;
            pathD = `M ${start.x} ${start.y} L ${start.x} ${offsetY} L ${end.x} ${offsetY} L ${end.x} ${end.y}`;
          }

          // Determine arrow color and marker based on label and active state
          let arrowColor = '#333333';
          let arrowMarker = 'arrowhead-default';

          if (isActive) {
            if (label === 'Yes') {
              arrowColor = '#4CAF50';
              arrowMarker = 'arrowhead-yes';
            } else if (label === 'No') {
              arrowColor = '#FF9800';
              arrowMarker = 'arrowhead-no';
            } else {
              arrowColor = '#2196F3';
              arrowMarker = 'arrowhead-active';
            }
          } else if (isActive === false) {
            // Explicitly inactive
            arrowColor = '#cccccc';
            arrowMarker = 'arrowhead-inactive';
          }

          return (
            <path
              key={`arrow-line-${index}`}
              d={pathD}
              stroke={arrowColor}
              strokeWidth={2 * finalScale}
              fill="none"
              markerEnd={`url(#${arrowMarker})`}
            />
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

        {/* Render Yes/No labels on top of everything */}
        {layout.connections.map((connection, index) => {
          if (!connection.label) return null;

          const { from, to, label, fromSide, toSide, isActive } = connection;

          const start = getStaggeredConnectionPoint(from, fromSide, true, index);
          const end = getStaggeredConnectionPoint(to, toSide, false, index);
          const midY = start.y + (end.y - start.y) / 2;
          const midX = start.x + (end.x - start.x) / 2;

          // Calculate label position to be centered on the actual path
          let labelPos = { x: midX, y: midY };
          if (fromSide === 'bottom' && toSide === 'top') {
            if (Math.abs(start.x - end.x) < 50) {
              // Same column - vertical line, center on vertical segment
              labelPos = { x: start.x, y: midY };
            } else {
              const goingLeft = end.x < start.x;
              if (goingLeft) {
                const downY = midY;
                // Center on horizontal segment
                labelPos = { x: midX, y: downY };
              } else {
                // Center on horizontal segment
                labelPos = { x: midX, y: midY };
              }
            }
          } else if (fromSide === 'right' && toSide === 'left') {
            if (Math.abs(start.y - end.y) < 50) {
              // Straight horizontal line
              labelPos = { x: midX, y: start.y };
            } else {
              // Center on the middle vertical segment
              labelPos = { x: midX, y: midY };
            }
          } else if (fromSide === 'right' && toSide === 'top') {
            const offsetX = start.x + 40;
            // Center of the diagonal-like connection
            labelPos = { x: (start.x + offsetX) / 2, y: start.y };
          } else if (fromSide === 'bottom' && toSide === 'left') {
            const offsetY = start.y + 30;
            // Center on horizontal segment
            labelPos = { x: midX, y: offsetY };
          } else if (fromSide === 'left' && toSide === 'top') {
            // Center on horizontal segment
            labelPos = { x: midX, y: start.y };
          } else if (fromSide === 'bottom' && toSide === 'right') {
            const offsetY = start.y + 30;
            // Center on horizontal segment
            labelPos = { x: midX, y: offsetY };
          }

          // Determine circle color based on active state
          let circleColor = label === 'Yes' ? '#4CAF50' : '#FF9800';
          if (isActive === false) {
            // Use gray for inactive circles
            circleColor = '#9e9e9e';
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
