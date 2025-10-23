import React from 'react';
import type { FlowChartData, ColumnPositions } from './types';
import { calculateLayout } from './layoutEngine';
import { Node } from './Node';

interface FlowChartV2Props {
  data: FlowChartData;
  title?: string;
  subtitle?: string;
  className?: string;
  columnPositions?: Partial<ColumnPositions>;
}

export const FlowChartV2: React.FC<FlowChartV2Props> = ({
  data,
  title,
  subtitle,
  className = '',
  columnPositions,
}) => {
  const layout = calculateLayout(data, {}, columnPositions);

  return (
    <div className={className} style={{ width: '100%', overflow: 'auto' }}>
      <svg
        width={layout.width}
        height={layout.height}
        xmlns="http://www.w3.org/2000/svg"
        style={{ minWidth: '100%' }}
      >
        {/* Define arrowhead marker */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3, 0 6"
              fill="#333333"
            />
          </marker>
        </defs>

        {/* Header */}
        {(title || subtitle) && (
          <g>
            {title && (
              <text
                x={layout.width / 2}
                y={25}
                textAnchor="middle"
                fontSize="18"
                fontWeight="bold"
                fill="#1e3a5f"
                fontFamily="Arial, sans-serif"
              >
                {title}
              </text>
            )}
            {subtitle && (
              <text
                x={layout.width - 20}
                y={25}
                textAnchor="end"
                fontSize="12"
                fill="#666666"
                fontFamily="Arial, sans-serif"
              >
                {subtitle}
              </text>
            )}
            {/* Header underline */}
            <line
              x1={20}
              y1={40}
              x2={layout.width - 20}
              y2={40}
              stroke="#4a90e2"
              strokeWidth="3"
            />
          </g>
        )}

        {/* Render arrow lines first (behind everything) */}
        {layout.connections.map((connection, index) => {
          const { from, to, fromSide, toSide } = connection;

          const getConnectionPoint = (
            node: typeof from | typeof to,
            side: 'top' | 'right' | 'bottom' | 'left'
          ) => {
            switch (side) {
              case 'top':
                return { x: node.x + node.width / 2, y: node.y };
              case 'right':
                return { x: node.x + node.width, y: node.y + node.height / 2 };
              case 'bottom':
                return { x: node.x + node.width / 2, y: node.y + node.height };
              case 'left':
                return { x: node.x, y: node.y + node.height / 2 };
            }
          };

          const start = getConnectionPoint(from, fromSide);
          const end = getConnectionPoint(to, toSide);
          const midY = start.y + (end.y - start.y) / 2;
          const midX = start.x + (end.x - start.x) / 2;

          // Create arrow path (same logic as Arrow component)
          let pathD = `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
          if (fromSide === 'bottom' && toSide === 'top') {
            if (Math.abs(start.x - end.x) >= 10) {
              const goingLeft = end.x < start.x;
              if (goingLeft) {
                const downY = midY;
                pathD = `M ${start.x} ${start.y} L ${start.x} ${downY} L ${end.x} ${downY} L ${end.x} ${end.y}`;
              } else {
                pathD = `M ${start.x} ${start.y} L ${start.x} ${midY} L ${end.x} ${midY} L ${end.x} ${end.y}`;
              }
            }
          } else if (fromSide === 'right' && toSide === 'left') {
            if (Math.abs(start.y - end.y) >= 10) {
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

          return (
            <path
              key={`arrow-line-${index}`}
              d={pathD}
              stroke="#333333"
              strokeWidth="2"
              fill="none"
              markerEnd="url(#arrowhead)"
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
          />
        ))}

        {/* Render Yes/No labels on top of everything */}
        {layout.connections.map((connection, index) => {
          if (!connection.label) return null;

          const { from, to, label, fromSide, toSide } = connection;

          const getConnectionPoint = (
            node: typeof from | typeof to,
            side: 'top' | 'right' | 'bottom' | 'left'
          ) => {
            switch (side) {
              case 'top':
                return { x: node.x + node.width / 2, y: node.y };
              case 'right':
                return { x: node.x + node.width, y: node.y + node.height / 2 };
              case 'bottom':
                return { x: node.x + node.width / 2, y: node.y + node.height };
              case 'left':
                return { x: node.x, y: node.y + node.height / 2 };
            }
          };

          const start = getConnectionPoint(from, fromSide);
          const end = getConnectionPoint(to, toSide);
          const midY = start.y + (end.y - start.y) / 2;
          const midX = start.x + (end.x - start.x) / 2;

          // Calculate label position (same logic as Arrow component)
          let labelPos = { x: midX, y: midY };
          if (fromSide === 'bottom' && toSide === 'top') {
            if (Math.abs(start.x - end.x) < 10) {
              labelPos = { x: start.x, y: midY };
            } else {
              const goingLeft = end.x < start.x;
              if (goingLeft) {
                const downY = midY;
                labelPos = { x: (start.x + end.x) / 2, y: downY };
              } else {
                labelPos = { x: (start.x + end.x) / 2, y: midY };
              }
            }
          } else if (fromSide === 'right' && toSide === 'left') {
            if (Math.abs(start.y - end.y) < 10) {
              labelPos = { x: midX, y: start.y };
            } else {
              labelPos = { x: midX, y: (start.y + end.y) / 2 };
            }
          } else if (fromSide === 'right' && toSide === 'top') {
            const offsetX = start.x + 40;
            labelPos = { x: (offsetX + end.x) / 2, y: (start.y + end.y) / 2 };
          } else if (fromSide === 'bottom' && toSide === 'left') {
            const offsetY = start.y + 30;
            labelPos = { x: (start.x + end.x) / 2, y: offsetY };
          } else if (fromSide === 'left' && toSide === 'top') {
            labelPos = { x: (start.x + end.x) / 2, y: start.y };
          } else if (fromSide === 'bottom' && toSide === 'right') {
            const offsetY = start.y + 30;
            labelPos = { x: (start.x + end.x) / 2, y: offsetY };
          }

          return (
            <g key={`label-${index}`}>
              <circle
                cx={labelPos.x}
                cy={labelPos.y}
                r="15"
                fill={label === 'Yes' ? '#4CAF50' : '#FF9800'}
                stroke="none"
              />
              <text
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#ffffff"
                fontSize="11"
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
