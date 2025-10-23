import React from 'react';
import type { Connection } from './types';

interface ArrowProps {
  connection: Connection;
}

export const Arrow: React.FC<ArrowProps> = ({ connection }) => {
  const { from, to, label, fromSide = 'bottom', toSide = 'top' } = connection;

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
      if (Math.abs(start.x - end.x) < 10) {
        // Straight down
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
      if (Math.abs(start.y - end.y) < 10) {
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

  // Calculate label position at the midpoint of the path
  const getLabelPosition = () => {
    const midY = start.y + (end.y - start.y) / 2;
    const midX = start.x + (end.x - start.x) / 2;

    if (fromSide === 'bottom' && toSide === 'top') {
      // Vertical paths
      if (Math.abs(start.x - end.x) < 10) {
        // Straight vertical line
        return { x: start.x, y: midY };
      } else {
        const goingLeft = end.x < start.x;
        if (goingLeft) {
          // For outcome → period, place label on the horizontal segment at midpoint
          const downY = midY;
          return { x: (start.x + end.x) / 2, y: downY };
        } else {
          // Path with horizontal segment
          return { x: (start.x + end.x) / 2, y: midY };
        }
      }
    } else if (fromSide === 'right' && toSide === 'left') {
      // Horizontal or stepped horizontal
      if (Math.abs(start.y - end.y) < 10) {
        // Straight horizontal
        return { x: midX, y: start.y };
      } else {
        // Stepped path - position at the turn
        return { x: midX, y: (start.y + end.y) / 2 };
      }
    } else if (fromSide === 'right' && toSide === 'top') {
      const offsetX = start.x + 40;
      // Position along the angled segment
      return { x: (offsetX + end.x) / 2, y: (start.y + end.y) / 2 };
    } else if (fromSide === 'bottom' && toSide === 'left') {
      const offsetY = start.y + 30;
      // Position on the horizontal segment
      return { x: (start.x + end.x) / 2, y: offsetY };
    } else if (fromSide === 'left' && toSide === 'top') {
      // Position on the corner where horizontal meets vertical
      return { x: (start.x + end.x) / 2, y: start.y };
    } else if (fromSide === 'bottom' && toSide === 'right') {
      const offsetY = start.y + 30;
      return { x: (start.x + end.x) / 2, y: offsetY };
    }

    // Default
    return { x: midX, y: midY };
  };

  const labelPos = getLabelPosition();

  return (
    <g>
      {/* Arrow line */}
      <path
        d={createPath()}
        stroke="#333333"
        strokeWidth="2"
        fill="none"
        markerEnd="url(#arrowhead)"
      />

      {/* Yes/No indicator */}
      {label && (
        <g>
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
      )}
    </g>
  );
};
