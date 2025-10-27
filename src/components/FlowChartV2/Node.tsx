import React from 'react';
import type { FlowNode } from './types';

interface NodeProps {
  node: FlowNode;
  x: number;
  y: number;
  width: number;
  height: number;
  scale?: number;
}

export const Node: React.FC<NodeProps> = ({ node, x, y, width, height, scale = 1 }) => {
  const getNodeStyle = () => {
    const isActive = node.isActive;

    switch (node.variant) {
      case 'primary':
        return {
          fill: '#1e3a5f',
          stroke: '#1e3a5f',
          textColor: '#ffffff',
          strokeWidth: isActive ? 4 : 2,
        };
      case 'neutral':
        return {
          fill: '#ffffff',
          stroke: '#333333',
          textColor: '#000000',
          strokeWidth: isActive ? 4 : 2,
        };
      case 'secondary':
        return {
          fill: '#e6f2ff',
          stroke: '#4a90e2',
          textColor: '#000000',
          strokeWidth: isActive ? 4 : 2,
        };
    }
  };

  const style = getNodeStyle();

  const renderText = () => {
    const lines = node.label.split('\n');

    // Use smaller font and line height for neutral nodes
    const fontSize = node.variant === 'neutral' ? 12 : 13;
    const lineHeight = node.variant === 'neutral' ? 14 : 16;

    const scaledFontSize = fontSize * scale;
    const scaledLineHeight = lineHeight * scale;
    const totalHeight = lines.length * scaledLineHeight;
    const startY = y + height / 2 - totalHeight / 2 + scaledLineHeight / 2;

    return (
      <text
        x={x + width / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={style.textColor}
        fontSize={scaledFontSize}
        fontWeight={node.variant === 'primary' ? 'bold' : 'normal'}
        fontFamily="Arial, sans-serif"
      >
        {lines.map((line, i) => (
          <tspan
            key={i}
            x={x + width / 2}
            y={startY + i * scaledLineHeight}
          >
            {line}
          </tspan>
        ))}
      </text>
    );
  };

  return (
    <g opacity={node.isActive === false ? 0.4 : 1}>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={style.fill}
        stroke={style.stroke}
        strokeWidth={style.strokeWidth * scale}
        rx={4 * scale}
      />
      {renderText()}
    </g>
  );
};
