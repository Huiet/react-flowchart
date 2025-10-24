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
    switch (node.type) {
      case 'period':
        return {
          fill: '#1e3a5f',
          stroke: '#1e3a5f',
          textColor: '#ffffff',
        };
      case 'decision':
        return {
          fill: '#ffffff',
          stroke: '#333333',
          textColor: '#000000',
        };
      case 'outcome':
        return {
          fill: '#e6f2ff',
          stroke: '#4a90e2',
          textColor: '#000000',
        };
    }
  };

  const style = getNodeStyle();

  const renderText = () => {
    if (node.type === 'decision' && node.question) {
      const lines = node.question.split('\n');
      const lineHeight = 14 * scale;
      const totalHeight = lines.length * lineHeight;
      const startY = y + height / 2 - totalHeight / 2 + lineHeight / 2;

      return (
        <text
          x={x + width / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={style.textColor}
          fontSize={12 * scale}
          fontFamily="Arial, sans-serif"
        >
          {lines.map((line, i) => (
            <tspan
              key={i}
              x={x + width / 2}
              y={startY + i * lineHeight}
            >
              {line}
            </tspan>
          ))}
        </text>
      );
    }

    const lines = node.label.split('\n');
    const lineHeight = 16 * scale;
    const totalHeight = lines.length * lineHeight;
    const startY = y + height / 2 - totalHeight / 2 + lineHeight / 2;

    return (
      <text
        x={x + width / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={style.textColor}
        fontSize={13 * scale}
        fontWeight={node.type === 'period' ? 'bold' : 'normal'}
        fontFamily="Arial, sans-serif"
      >
        {lines.map((line, i) => (
          <tspan
            key={i}
            x={x + width / 2}
            y={startY + i * lineHeight}
          >
            {line}
          </tspan>
        ))}
      </text>
    );
  };

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={style.fill}
        stroke={style.stroke}
        strokeWidth={2 * scale}
        rx={4 * scale}
      />
      {renderText()}
    </g>
  );
};
