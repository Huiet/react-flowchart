import type {
  FlowChartData,
  FlowNode,
  PositionedNode,
  Connection,
  LayoutConfig,
  ColumnPositions,
  LayoutResult,
  NodeConnection,
} from './types';

const defaultConfig: LayoutConfig = {
  nodeSpacing: 50,      // Vertical spacing between nodes in the same flow
  primaryWidth: 180,    // Standardized width for all nodes
  primaryHeight: 70,    // Standardized height for all nodes
  neutralWidth: 180,
  neutralHeight: 70,
  secondaryWidth: 180,
  secondaryHeight: 70,
  scale: 1,
};

const COLUMN_X_POSITIONS: ColumnPositions = {
  1: 50,      // Column 1 (default for primary)
  2: 300,     // Column 2 (default for neutral) - 50 + 180 + 70 gap
  3: 550,     // Column 3 (default for secondary) - 300 + 180 + 70 gap
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

  // Check if a position would cause node overlap
  function hasCollision(x: number, y: number, width: number, height: number): boolean {
    const buffer = 15 * cfg.scale; // Minimum spacing between nodes

    for (const positioned of nodes) {
      // Check if rectangles overlap with buffer
      const noOverlapX = x + width + buffer <= positioned.x || positioned.x + positioned.width + buffer <= x;
      const noOverlapY = y + height + buffer <= positioned.y || positioned.y + positioned.height + buffer <= y;

      if (!noOverlapX && !noOverlapY) {
        return true;
      }
    }

    return false;
  }

  // Find available position, adjusting Y if there's a collision
  function findAvailablePosition(x: number, y: number, width: number, height: number): { x: number; y: number } {
    let currentY = y;
    const maxAttempts = 50;
    const offsetStep = 20 * cfg.scale;

    for (let i = 0; i < maxAttempts; i++) {
      if (!hasCollision(x, currentY, width, height)) {
        return { x, y: currentY };
      }
      currentY += offsetStep;
    }

    // If we still have collision after max attempts, just return the last position
    return { x, y: currentY };
  }

  function positionNode(node: FlowNode, x: number, y: number): PositionedNode {
    // Return existing position if already placed
    if (nodeMap.has(node.id)) {
      return nodeMap.get(node.id)!;
    }

    const { width, height } = getNodeDimensions(node);

    // Find a position without collisions
    const { x: finalX, y: finalY } = findAvailablePosition(x, y, width, height);

    const positioned: PositionedNode = { node, x: finalX, y: finalY, width, height };

    nodes.push(positioned);
    nodeMap.set(node.id, positioned);

    maxX = Math.max(maxX, finalX + width);
    maxY = Math.max(maxY, finalY + height);

    return positioned;
  }

  function layoutNode(
    nodeId: string | undefined,
    x: number,
    y: number,
    parentNode?: PositionedNode,
    connection?: NodeConnection,
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
          label: connection?.label,
          color: connection?.color,
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
    if (parentNode && connection) {
      // Mark connection as active if both nodes are active
      const isActive = parentNode.node.isActive && positioned.node.isActive;

      connections.push({
        from: parentNode,
        to: positioned,
        label: connection.label,
        color: connection.color,
        fromSide: explicitFromSide || 'right',
        toSide: explicitToSide || 'left',
        isActive,
      });
    }

    // Handle all outgoing connections from this node
    node.connections.forEach((conn, connIndex) => {
      const targetNode = chartData.nodes.find(n => n.id === conn.targetId);
      if (!targetNode) {
        console.error(`Node ${node.id}: connection references "${conn.targetId}" but node not found`);
        return;
      }

      const targetColumn = getNodeColumn(targetNode);
      const targetDims = getNodeDimensions(targetNode);

      // Determine connection sides and position based on variants
      let targetY: number;
      let fromSide: 'top' | 'right' | 'bottom' | 'left';
      let toSide: 'top' | 'right' | 'bottom' | 'left';

      // Default routing logic based on node positions
      if (node.variant === 'primary' && targetNode.variant === 'neutral') {
        // Primary → Neutral: horizontal connection at same level
        const primaryMidpoint = positioned.height / 2;
        const targetMidpoint = targetDims.height / 2;
        targetY = y + primaryMidpoint - targetMidpoint;
        fromSide = 'right';
        toSide = 'left';
      } else if (node.variant === 'neutral' && targetNode.variant === 'secondary') {
        // Neutral → Secondary: horizontal connection at same level
        const neutralMidpoint = positioned.height / 2;
        const secondaryMidpoint = targetDims.height / 2;
        // Offset slightly if multiple connections exist
        const offset = connIndex > 0 ? connIndex * 15 * cfg.scale : 0;
        targetY = y + neutralMidpoint - secondaryMidpoint + offset;
        fromSide = 'right';
        toSide = 'left';
      } else if (node.variant === 'neutral' && targetNode.variant === 'neutral') {
        // Neutral → Neutral: vertical connection
        targetY = y + positioned.height + cfg.nodeSpacing * cfg.scale;
        fromSide = 'bottom';
        toSide = 'top';
      } else if (targetNode.variant === 'primary') {
        // Any → Primary: loop back, exit from left/bottom
        targetY = y + positioned.height + cfg.nodeSpacing * cfg.scale;
        fromSide = node.variant === 'neutral' ? 'left' : 'bottom';
        toSide = 'top';
      } else if (node.variant === 'secondary') {
        // Secondary → Any: vertical connection
        targetY = y + positioned.height + cfg.nodeSpacing * cfg.scale;
        fromSide = 'bottom';
        toSide = 'top';
      } else {
        // Default: vertical connection
        targetY = y + positioned.height + cfg.nodeSpacing * cfg.scale;
        fromSide = 'bottom';
        toSide = 'top';
      }

      layoutNode(conn.targetId, targetColumn, targetY, positioned, conn, fromSide, toSide);
    });
  }

  // Start layout from root - use column 1 as default starting position
  const rootNode = chartData.nodes.find(n => n.id === chartData.rootId);
  const rootColumn = rootNode ? getNodeColumn(rootNode) : (columns[1] ?? 50) * cfg.scale;
  layoutNode(chartData.rootId, rootColumn, 50 * cfg.scale);

  // Calculate final dimensions
  const minWidth = (columns[3] ?? 550) * cfg.scale + cfg.secondaryWidth * cfg.scale + 100 * cfg.scale;
  const calculatedWidth = Math.max(maxX + 100 * cfg.scale, minWidth);

  return {
    nodes,
    connections,
    width: calculatedWidth,
    height: maxY + 100 * cfg.scale,
  };
}
