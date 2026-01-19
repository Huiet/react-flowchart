import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { FlowNode } from './types';

interface FlowChartD3Props {
  data: FlowNode;
  title?: string;
  subtitle?: string;
  width?: number;
  height?: number;
}

interface D3Node {
  id: string;
  type: string;
  label: string;
  question?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface D3Link {
  source: D3Node;
  target: D3Node;
  label?: 'Yes' | 'No';
}

/**
 * Alternative FlowChart implementation using D3.js
 *
 * This version uses D3 for DOM manipulation and transitions.
 * The pure SVG version (FlowChart.tsx) is recommended for most use cases
 * as it's simpler and doesn't require D3 as a dependency.
 *
 * Use this version if you need:
 * - D3 transitions and animations
 * - Interactive features like zooming/panning
 * - Integration with other D3 visualizations
 */
export const FlowChartD3: React.FC<FlowChartD3Props> = ({
  data,
  title,
  subtitle,
  width = 1200,
  height = 800,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear previous render
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current);

    // Convert FlowNode tree to flat array of nodes and links
    const nodes: D3Node[] = [];
    const links: D3Link[] = [];
    const nodeMap = new Map<string, D3Node>();

    let currentY = 80;
    const nodeWidth = 200;
    const nodeHeight = 80;
    const verticalSpacing = 100;
    const horizontalSpacing = 250;

    function processNode(
      node: FlowNode,
      x: number,
      y: number,
      parent?: D3Node,
      linkLabel?: 'Yes' | 'No'
    ) {
      if (nodeMap.has(node.id)) {
        const existing = nodeMap.get(node.id)!;
        if (parent) {
          links.push({ source: parent, target: existing, label: linkLabel });
        }
        return;
      }

      const d3Node: D3Node = {
        id: node.id,
        type: node.type,
        label: node.label,
        question: node.type === 'decision' ? node.question : undefined,
        x,
        y,
        width: nodeWidth,
        height: nodeHeight,
      };

      nodes.push(d3Node);
      nodeMap.set(node.id, d3Node);

      if (parent) {
        links.push({ source: parent, target: d3Node, label: linkLabel });
      }

      if (node.type === 'period' && node.next) {
        processNode(node.next, x, y + nodeHeight + verticalSpacing, d3Node);
      } else if (node.type === 'decision') {
        const nextY = y + nodeHeight + verticalSpacing;
        if (node.yesPath) {
          processNode(node.yesPath, x + horizontalSpacing, nextY, d3Node, 'Yes');
        }
        if (node.noPath) {
          processNode(node.noPath, x - horizontalSpacing, nextY, d3Node, 'No');
        }
      } else if (node.type === 'outcome' && node.next) {
        processNode(node.next, x, y + nodeHeight + verticalSpacing, d3Node);
      }
    }

    processNode(data, width / 2, currentY);

    // Create arrowhead marker
    svg
      .append('defs')
      .append('marker')
      .attr('id', 'arrowhead-d3')
      .attr('markerWidth', 10)
      .attr('markerHeight', 10)
      .attr('refX', 9)
      .attr('refY', 3)
      .attr('orient', 'auto')
      .append('polygon')
      .attr('points', '0 0, 10 3, 0 6')
      .attr('fill', '#333');

    // Draw links
    const linkGroup = svg.append('g').attr('class', 'links');

    links.forEach((link) => {
      const { source, target, label } = link;

      // Simple straight line for now (can be enhanced with D3 path generators)
      const sourceX = source.x + source.width / 2;
      const sourceY = source.y + source.height;
      const targetX = target.x + target.width / 2;
      const targetY = target.y;

      linkGroup
        .append('line')
        .attr('x1', sourceX)
        .attr('y1', sourceY)
        .attr('x2', targetX)
        .attr('y2', targetY)
        .attr('stroke', '#333')
        .attr('stroke-width', 2)
        .attr('marker-end', 'url(#arrowhead-d3)');

      if (label) {
        const midX = (sourceX + targetX) / 2;
        const midY = (sourceY + targetY) / 2;

        linkGroup
          .append('circle')
          .attr('cx', midX)
          .attr('cy', midY)
          .attr('r', 15)
          .attr('fill', label === 'Yes' ? '#4CAF50' : '#FF9800');

        linkGroup
          .append('text')
          .attr('x', midX)
          .attr('y', midY)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('fill', '#fff')
          .attr('font-size', '11')
          .attr('font-weight', 'bold')
          .text(label);
      }
    });

    // Draw nodes
    const nodeGroup = svg.append('g').attr('class', 'nodes');

    nodes.forEach((node) => {
      const g = nodeGroup.append('g').attr('class', `node-${node.type}`);

      // Node background
      const fill =
        node.type === 'period' ? '#1e3a5f' : node.type === 'decision' ? '#fff' : '#e6f2ff';
      const stroke = node.type === 'decision' ? '#333' : fill;

      g.append('rect')
        .attr('x', node.x)
        .attr('y', node.y)
        .attr('width', node.width)
        .attr('height', node.height)
        .attr('fill', fill)
        .attr('stroke', stroke)
        .attr('stroke-width', 2)
        .attr('rx', 4);

      // Node text
      const text = node.type === 'decision' ? node.question || '' : node.label;
      const lines = text.split('\n');
      const textColor = node.type === 'period' ? '#fff' : '#000';

      const textGroup = g
        .append('text')
        .attr('x', node.x + node.width / 2)
        .attr('y', node.y + node.height / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', textColor)
        .attr('font-size', '12')
        .attr('font-weight', node.type === 'period' ? 'bold' : 'normal');

      lines.forEach((line, i) => {
        textGroup
          .append('tspan')
          .attr('x', node.x + node.width / 2)
          .attr('dy', i === 0 ? 0 : 14)
          .text(line);
      });
    });

    // Header
    if (title) {
      svg
        .append('text')
        .attr('x', width / 2)
        .attr('y', 25)
        .attr('text-anchor', 'middle')
        .attr('font-size', '18')
        .attr('font-weight', 'bold')
        .attr('fill', '#1e3a5f')
        .text(title);
    }

    if (subtitle) {
      svg
        .append('text')
        .attr('x', width - 20)
        .attr('y', 25)
        .attr('text-anchor', 'end')
        .attr('font-size', '12')
        .attr('fill', '#666')
        .text(subtitle);
    }
  }, [data, title, subtitle, width, height]);

  return (
    <div style={{ width: '100%', overflow: 'auto' }}>
      <svg ref={svgRef} width={width} height={height} />
    </div>
  );
};
