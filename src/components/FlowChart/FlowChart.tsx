import React from 'react';
import { Arrow } from './Arrow';
import { calculateLayout, calculateLayoutFromRefs } from './layoutEngine';
import { Node } from './Node';
import type { ColumnPositions, FlowChartData, FlowNode } from './types';

interface FlowChartProps {
  // Support both models: nested or reference-based
  data?: FlowNode; // Legacy nested model
  chartData?: FlowChartData; // New reference-based model
  title?: string;
  subtitle?: string;
  className?: string;
  columnPositions?: Partial<ColumnPositions>;
}

export const FlowChart: React.FC<FlowChartProps> = ({
  data,
  chartData,
  title,
  subtitle,
  className = '',
  columnPositions,
}) => {
  // Use reference-based layout if chartData is provided, otherwise use nested
  const layout = chartData
    ? calculateLayoutFromRefs(chartData, {}, columnPositions)
    : calculateLayout(data!, {}, columnPositions);

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
          <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="#333333" />
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
            <line x1={20} y1={40} x2={layout.width - 20} y2={40} stroke="#4a90e2" strokeWidth="3" />
          </g>
        )}

        {/* Render connections first (so they're behind nodes) */}
        {layout.connections.map((connection, index) => (
          <Arrow key={`conn-${index}`} connection={connection} />
        ))}

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
      </svg>
    </div>
  );
};
