import React from 'react';
import type { Connection } from './types';

interface ArrowProps {
  connection: Connection;
}

export const Arrow: React.FC<ArrowProps> = ({ connection }) => {
  const { from, to, label, fromSide = 'bottom', toSide = 'top', isActive } = connection;

  // Calculate connection points based on sides
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

  // Create path with right angles
  const createPath = () => {
    const midY = start.y + (end.y - start.y) / 2;
    const midX = start.x + (end.x - start.x) / 2;

    if (fromSide === 'bottom' && toSide === 'top') {
      // Straight vertical or with horizontal offset
      if (Math.abs(start.x - end.x) < 50) {
        // Straight down - same column
        return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
      } else {
        // Check if this is going left (outcome → period) or right
        const goingLeft = end.x < start.x;
        if (goingLeft) {
          // Clean orthogonal path: down, left, up to top
          const downY = midY; // Go down to midpoint
          return `M ${start.x} ${start.y} L ${start.x} ${downY} L ${end.x} ${downY} L ${end.x} ${end.y}`;
        } else {
          // Down, across, down (for different columns going right)
          return `M ${start.x} ${start.y} L ${start.x} ${midY} L ${end.x} ${midY} L ${end.x} ${end.y}`;
        }
      }
    } else if (fromSide === 'right' && toSide === 'left') {
      // Direct horizontal connection (same Y level)
      if (Math.abs(start.y - end.y) < 50) {
        return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
      } else {
        // Right, down/up, right
        return `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${end.y} L ${end.x} ${end.y}`;
      }
    } else if (fromSide === 'right' && toSide === 'top') {
      // From node's right side to target's top - create angled path for branching
      const offsetX = start.x + 40;
      const offsetY = end.y - 20;
      return `M ${start.x} ${start.y} L ${offsetX} ${start.y} L ${end.x} ${offsetY} L ${end.x} ${end.y}`;
    } else if (fromSide === 'bottom' && toSide === 'left') {
      // Down then left (for outcome → period or decision → decision)
      const offsetY = start.y + 30;
      return `M ${start.x} ${start.y} L ${start.x} ${offsetY} L ${end.x} ${offsetY} L ${end.x} ${end.y}`;
    } else if (fromSide === 'left' && toSide === 'top') {
      // From left side to top (for decision No → period loop back)
      // Go horizontally first, then vertically
      return `M ${start.x} ${start.y} L ${end.x} ${start.y} L ${end.x} ${end.y}`;
    } else if (fromSide === 'bottom' && toSide === 'right') {
      // Down then right
      const offsetY = start.y + 30;
      return `M ${start.x} ${start.y} L ${start.x} ${offsetY} L ${end.x} ${offsetY} L ${end.x} ${end.y}`;
    }

    // Default: straight line
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  };

  // Calculate label position to be centered on the actual path
  const getLabelPosition = () => {
    const midY = start.y + (end.y - start.y) / 2;
    const midX = start.x + (end.x - start.x) / 2;

    if (fromSide === 'bottom' && toSide === 'top') {
      // Vertical paths
      if (Math.abs(start.x - end.x) < 50) {
        // Same column - vertical line, center on vertical segment
        return { x: start.x, y: midY };
      } else {
        const goingLeft = end.x < start.x;
        if (goingLeft) {
          const downY = midY;
          // Center on horizontal segment
          return { x: midX, y: downY };
        } else {
          // Center on horizontal segment
          return { x: midX, y: midY };
        }
      }
    } else if (fromSide === 'right' && toSide === 'left') {
      // Horizontal or stepped horizontal
      if (Math.abs(start.y - end.y) < 50) {
        // Straight horizontal
        return { x: midX, y: start.y };
      } else {
        // Center on the middle vertical segment
        return { x: midX, y: midY };
      }
    } else if (fromSide === 'right' && toSide === 'top') {
      const offsetX = start.x + 40;
      // Center of the horizontal segment at the start
      return { x: (start.x + offsetX) / 2, y: start.y };
    } else if (fromSide === 'bottom' && toSide === 'left') {
      const offsetY = start.y + 30;
      // Center on horizontal segment
      return { x: midX, y: offsetY };
    } else if (fromSide === 'left' && toSide === 'top') {
      // Center on horizontal segment
      return { x: midX, y: start.y };
    } else if (fromSide === 'bottom' && toSide === 'right') {
      const offsetY = start.y + 30;
      // Center on horizontal segment
      return { x: midX, y: offsetY };
    }

    // Default
    return { x: midX, y: midY };
  };

  const labelPos = getLabelPosition();

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
    <g>
      {/* Arrow line */}
      <path
        d={createPath()}
        stroke={arrowColor}
        strokeWidth="2"
        fill="none"
        markerEnd={`url(#${arrowMarker})`}
      />

      {/* Yes/No indicator */}
      {label && (
        <g>
          <circle
            cx={labelPos.x}
            cy={labelPos.y}
            r="15"
            fill={isActive === false ? '#9e9e9e' : label === 'Yes' ? '#4CAF50' : '#FF9800'}
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
      )}
    </g>
  );
};
