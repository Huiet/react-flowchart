import type {
  FlowChartData,
  FlowNode,
  PositionedNode,
  Connection,
  LayoutConfig,
  ColumnPositions,
  LayoutResult,
} from './types';

const defaultConfig: LayoutConfig = {
  nodeSpacing: 50,
  startWidth: 110,
  startHeight: 50,
  decisionWidth: 180,
  decisionHeight: 70,
  outcomeWidth: 200,
  outcomeHeight: 60,
  scale: 1,
};

const COLUMN_X_POSITIONS: ColumnPositions = {
  left: 50,      // Start nodes
  middle: 200,   // Decision nodes
  right: 450,    // Outcome nodes
};

export function calculateLayout(
  chartData: FlowChartData,
  config: Partial<LayoutConfig> = {},
  columnPositions?: Partial<ColumnPositions>
): LayoutResult {
  const cfg = { ...defaultConfig, ...config };
  const columns = { ...COLUMN_X_POSITIONS, ...columnPositions };

  const nodes: PositionedNode[] = [];
  const connections: Connection[] = [];
  const nodeMap = new Map<string, PositionedNode>();
  const visited = new Set<string>();

  let maxX = 0;
  let maxY = 0;

  function getNodeDimensions(node: FlowNode) {
    switch (node.type) {
      case 'start':
        return { width: cfg.startWidth * cfg.scale, height: cfg.startHeight * cfg.scale };
      case 'decision':
        return { width: cfg.decisionWidth * cfg.scale, height: cfg.decisionHeight * cfg.scale };
      case 'outcome':
        return { width: cfg.outcomeWidth * cfg.scale, height: cfg.outcomeHeight * cfg.scale };
    }
  }

  function getNodeColumn(node: FlowNode): number {
    switch (node.type) {
      case 'start':
        return columns.left * cfg.scale;
      case 'decision':
        return columns.middle * cfg.scale;
      case 'outcome':
        return columns.right * cfg.scale;
    }
  }

  function positionNode(node: FlowNode, x: number, y: number): PositionedNode {
    // Return existing position if already placed
    if (nodeMap.has(node.id)) {
      return nodeMap.get(node.id)!;
    }

    const { width, height } = getNodeDimensions(node);
    const positioned: PositionedNode = { node, x, y, width, height };

    nodes.push(positioned);
    nodeMap.set(node.id, positioned);

    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);

    return positioned;
  }

  function layoutNode(
    nodeId: string | undefined,
    x: number,
    y: number,
    parentNode?: PositionedNode,
    connectionLabel?: 'Yes' | 'No',
    explicitFromSide?: 'top' | 'right' | 'bottom' | 'left',
    explicitToSide?: 'top' | 'right' | 'bottom' | 'left'
  ) {
    if (!nodeId) {
      if (parentNode) {
        console.error('Layout warning: Node ID is undefined from parent:', parentNode.node.id);
      }
      return;
    }

    if (visited.has(nodeId)) {
      console.log(`Node ${nodeId} already visited - creating connection to existing node`);
      // Node already positioned - just create connection if parent exists
      if (parentNode && nodeMap.has(nodeId)) {
        const existingNode = nodeMap.get(nodeId)!;
        // Mark connection as active if both nodes are active
        const isActive = parentNode.node.isActive && existingNode.node.isActive;

        connections.push({
          from: parentNode,
          to: existingNode,
          label: connectionLabel,
          fromSide: explicitFromSide || 'right',
          toSide: explicitToSide || 'left',
          isActive,
        });
      }
      return;
    }

    const node = chartData.nodes.find(n => n.id === nodeId);
    if (!node) {
      console.error(`Layout error: Node "${nodeId}" not found in chartData.nodes`);
      return;
    }

    visited.add(nodeId);

    const column = getNodeColumn(node);
    const positioned = positionNode(node, column, y);

    // Create connection from parent if exists
    if (parentNode) {
      // Mark connection as active if both nodes are active
      const isActive = parentNode.node.isActive && positioned.node.isActive;

      connections.push({
        from: parentNode,
        to: positioned,
        label: connectionLabel,
        fromSide: explicitFromSide || 'right',
        toSide: explicitToSide || 'left',
        isActive,
      });
    }

    // Handle navigation based on node type and available paths
    if (node.type === 'start') {
      // Start → next node (usually decision)
      if (node.next) {
        const nextNode = chartData.nodes.find(n => n.id === node.next);
        if (nextNode) {
          // Calculate Y offset to align midpoints for horizontal arrow
          const nextDims = getNodeDimensions(nextNode);
          const startMidpoint = positioned.height / 2;
          const nextMidpoint = nextDims.height / 2;
          const alignedY = y + startMidpoint - nextMidpoint;

          layoutNode(node.next, columns.middle, alignedY, positioned, undefined, 'right', 'left');
        }
      }
    } else if (node.type === 'decision') {
      const hasYes = !!node.nextYes;
      const hasNo = !!node.nextNo;

      // Get target nodes to determine their types
      const yesNode = node.nextYes ? chartData.nodes.find(n => n.id === node.nextYes) : undefined;
      const noNode = node.nextNo ? chartData.nodes.find(n => n.id === node.nextNo) : undefined;

      if (node.nextYes && !yesNode) {
        console.error(`Decision ${node.id}: nextYes references "${node.nextYes}" but node not found`);
      }
      if (node.nextNo && !noNode) {
        console.error(`Decision ${node.id}: nextNo references "${node.nextNo}" but node not found`);
      }

      const yesY = y; // Yes path at same level

      // Handle Yes path
      if (node.nextYes && yesNode) {
        if (yesNode.type === 'outcome') {
          // Yes → Outcome (right column, same level)
          // Calculate Y offset to align midpoints for horizontal arrow
          const yesDims = getNodeDimensions(yesNode);
          const decisionMidpoint = positioned.height / 2;
          const outcomeMidpoint = yesDims.height / 2;
          const alignedYesY = y + decisionMidpoint - outcomeMidpoint;

          layoutNode(node.nextYes, columns.right, alignedYesY, positioned, 'Yes', 'right', 'left');
        } else if (yesNode.type === 'decision') {
          // Yes → Decision (middle column, same level)
          layoutNode(node.nextYes, columns.middle, yesY, positioned, 'Yes', 'bottom', 'top');
        } else if (yesNode.type === 'start') {
          // Yes → Start (left column, below)
          const nextY = y + positioned.height + cfg.nodeSpacing * cfg.scale;
          layoutNode(node.nextYes, columns.left, nextY, positioned, 'Yes', 'bottom', 'top');
        }
      }

      // Handle No path
      if (node.nextNo && noNode) {
        const yesBranch = yesNode?.type === 'outcome';
        const outcomeOffset = yesBranch ? 70 : 0;

        console.log(`Decision ${node.id} No path:`, {
          targetId: node.nextNo,
          targetType: noNode.type,
          currentY: y,
          yesBranch,
        });

        if (noNode.type === 'outcome') {
          // No → Outcome: exit RIGHT, enter LEFT (right column, below yes if needed)
          // Calculate Y offset to align midpoints for horizontal arrow
          const noDims = getNodeDimensions(noNode);
          const decisionMidpoint = positioned.height / 2;
          const outcomeMidpoint = noDims.height / 2;
          const alignedNoY = y + outcomeOffset + decisionMidpoint - outcomeMidpoint;

          layoutNode(node.nextNo, columns.right, alignedNoY, positioned, 'No', 'right', 'left');
        } else if (noNode.type === 'decision') {
          // No → Decision: exit BOTTOM, enter TOP (middle column, below)
          const nextY = y + positioned.height + cfg.nodeSpacing * cfg.scale;
          layoutNode(node.nextNo, columns.middle, nextY, positioned, 'No', 'bottom', 'top');
        } else if (noNode.type === 'start') {
          // No → Start: exit LEFT, enter TOP (left column, below) - LOOP BACK
          console.log(`Connecting decision ${node.id} No path to start ${node.nextNo}`);
          const nextY = y + positioned.height + cfg.nodeSpacing * cfg.scale;
          layoutNode(node.nextNo, columns.left, nextY, positioned, 'No', 'left', 'top');
        }
      }

      // Handle single path via 'next' if no yes/no paths
      if (!hasYes && !hasNo && node.next) {
        const nextNode = chartData.nodes.find(n => n.id === node.next);
        if (nextNode) {
          const nextY = y + positioned.height + cfg.nodeSpacing * cfg.scale;
          layoutNode(node.next, getNodeColumn(nextNode), nextY, positioned, undefined, 'bottom', 'top');
        }
      }
    } else if (node.type === 'outcome') {
      // Outcome → next node
      if (node.next) {
        const nextNode = chartData.nodes.find(n => n.id === node.next);
        if (!nextNode) return;

        const nextY = y + positioned.height + cfg.nodeSpacing * cfg.scale;
        const targetColumn = getNodeColumn(nextNode);

        layoutNode(node.next, targetColumn, nextY, positioned, undefined, 'bottom', 'top');
      }
    }
  }

  // Start layout from root
  layoutNode(chartData.rootId, columns.left * cfg.scale, 50 * cfg.scale);

  // Calculate final dimensions
  const minWidth = columns.right * cfg.scale + cfg.outcomeWidth * cfg.scale + 100 * cfg.scale;
  const calculatedWidth = Math.max(maxX + 100 * cfg.scale, minWidth);

  return {
    nodes,
    connections,
    width: calculatedWidth,
    height: maxY + 100 * cfg.scale,
  };
}
