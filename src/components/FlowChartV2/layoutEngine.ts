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
  primaryWidth: 110,
  primaryHeight: 50,
  neutralWidth: 180,
  neutralHeight: 70,
  secondaryWidth: 200,
  secondaryHeight: 60,
  scale: 1,
};

const COLUMN_X_POSITIONS: ColumnPositions = {
  1: 50,      // Column 1 (default for primary)
  2: 200,     // Column 2 (default for neutral)
  3: 450,     // Column 3 (default for secondary)
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
    switch (node.variant) {
      case 'primary':
        return { width: cfg.primaryWidth * cfg.scale, height: cfg.primaryHeight * cfg.scale };
      case 'neutral':
        return { width: cfg.neutralWidth * cfg.scale, height: cfg.neutralHeight * cfg.scale };
      case 'secondary':
        return { width: cfg.secondaryWidth * cfg.scale, height: cfg.secondaryHeight * cfg.scale };
    }
  }

  function getNodeColumn(node: FlowNode): number {
    // Use explicit column if provided, otherwise default based on variant
    let columnNumber: number;
    if (node.column !== undefined) {
      columnNumber = node.column;
    } else {
      // Default column based on variant
      switch (node.variant) {
        case 'primary':
          columnNumber = 1;
          break;
        case 'neutral':
          columnNumber = 2;
          break;
        case 'secondary':
          columnNumber = 3;
          break;
      }
    }

    // Get x-position for this column, default to column * 200 if not defined
    const xPosition = columns[columnNumber] ?? (columnNumber * 200);
    return xPosition * cfg.scale;
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

    // Handle navigation based on node variant and available paths
    if (node.variant === 'primary') {
      // Primary → next node (usually neutral)
      if (node.next) {
        const nextNode = chartData.nodes.find(n => n.id === node.next);
        if (nextNode) {
          // Calculate Y offset to align midpoints for horizontal arrow
          const nextDims = getNodeDimensions(nextNode);
          const primaryMidpoint = positioned.height / 2;
          const nextMidpoint = nextDims.height / 2;
          const alignedY = y + primaryMidpoint - nextMidpoint;

          const nextColumn = getNodeColumn(nextNode);
          layoutNode(node.next, nextColumn, alignedY, positioned, undefined, 'right', 'left');
        }
      }
    } else if (node.variant === 'neutral') {
      const hasYes = !!node.nextYes;
      const hasNo = !!node.nextNo;

      // Get target nodes to determine their variants
      const yesNode = node.nextYes ? chartData.nodes.find(n => n.id === node.nextYes) : undefined;
      const noNode = node.nextNo ? chartData.nodes.find(n => n.id === node.nextNo) : undefined;

      if (node.nextYes && !yesNode) {
        console.error(`Neutral ${node.id}: nextYes references "${node.nextYes}" but node not found`);
      }
      if (node.nextNo && !noNode) {
        console.error(`Neutral ${node.id}: nextNo references "${node.nextNo}" but node not found`);
      }

      const yesY = y; // Yes path at same level

      // Handle Yes path
      if (node.nextYes && yesNode) {
        const yesNodeColumn = getNodeColumn(yesNode);

        if (yesNode.variant === 'secondary') {
          // Yes → Secondary (typically right column, same level)
          // Calculate Y offset to align midpoints for horizontal arrow
          const yesDims = getNodeDimensions(yesNode);
          const neutralMidpoint = positioned.height / 2;
          const secondaryMidpoint = yesDims.height / 2;
          const alignedYesY = y + neutralMidpoint - secondaryMidpoint;

          layoutNode(node.nextYes, yesNodeColumn, alignedYesY, positioned, 'Yes', 'right', 'left');
        } else if (yesNode.variant === 'neutral') {
          // Yes → Neutral (typically middle column, same level)
          layoutNode(node.nextYes, yesNodeColumn, yesY, positioned, 'Yes', 'bottom', 'top');
        } else if (yesNode.variant === 'primary') {
          // Yes → Primary (typically left column, below)
          const nextY = y + positioned.height + cfg.nodeSpacing * cfg.scale;
          layoutNode(node.nextYes, yesNodeColumn, nextY, positioned, 'Yes', 'bottom', 'top');
        }
      }

      // Handle No path
      if (node.nextNo && noNode) {
        const yesBranch = yesNode?.variant === 'secondary';
        const secondaryOffset = yesBranch ? 70 : 0;
        const noNodeColumn = getNodeColumn(noNode);

        console.log(`Neutral ${node.id} No path:`, {
          targetId: node.nextNo,
          targetVariant: noNode.variant,
          currentY: y,
          yesBranch,
        });

        if (noNode.variant === 'secondary') {
          // No → Secondary: exit RIGHT, enter LEFT (typically right column, below yes if needed)
          // Calculate Y offset to align midpoints for horizontal arrow
          const noDims = getNodeDimensions(noNode);
          const neutralMidpoint = positioned.height / 2;
          const secondaryMidpoint = noDims.height / 2;
          const alignedNoY = y + secondaryOffset + neutralMidpoint - secondaryMidpoint;

          layoutNode(node.nextNo, noNodeColumn, alignedNoY, positioned, 'No', 'right', 'left');
        } else if (noNode.variant === 'neutral') {
          // No → Neutral: exit BOTTOM, enter TOP (typically middle column, below)
          const nextY = y + positioned.height + cfg.nodeSpacing * cfg.scale;
          layoutNode(node.nextNo, noNodeColumn, nextY, positioned, 'No', 'bottom', 'top');
        } else if (noNode.variant === 'primary') {
          // No → Primary: exit LEFT, enter TOP (typically left column, below) - LOOP BACK
          console.log(`Connecting neutral ${node.id} No path to primary ${node.nextNo}`);
          const nextY = y + positioned.height + cfg.nodeSpacing * cfg.scale;
          layoutNode(node.nextNo, noNodeColumn, nextY, positioned, 'No', 'left', 'top');
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
    } else if (node.variant === 'secondary') {
      // Secondary → next node
      if (node.next) {
        const nextNode = chartData.nodes.find(n => n.id === node.next);
        if (!nextNode) return;

        const nextY = y + positioned.height + cfg.nodeSpacing * cfg.scale;
        const targetColumn = getNodeColumn(nextNode);

        layoutNode(node.next, targetColumn, nextY, positioned, undefined, 'bottom', 'top');
      }
    }
  }

  // Start layout from root - use column 1 as default starting position
  const rootNode = chartData.nodes.find(n => n.id === chartData.rootId);
  const rootColumn = rootNode ? getNodeColumn(rootNode) : (columns[1] ?? 50) * cfg.scale;
  layoutNode(chartData.rootId, rootColumn, 50 * cfg.scale);

  // Calculate final dimensions
  const minWidth = (columns[3] ?? 450) * cfg.scale + cfg.secondaryWidth * cfg.scale + 100 * cfg.scale;
  const calculatedWidth = Math.max(maxX + 100 * cfg.scale, minWidth);

  return {
    nodes,
    connections,
    width: calculatedWidth,
    height: maxY + 100 * cfg.scale,
  };
}
