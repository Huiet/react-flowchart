import type {
  ColumnPositions,
  Connection,
  FlowChartData,
  FlowNode,
  LayoutConfig,
  LayoutResult,
  NodeConnection,
  PositionedNode,
} from './types';

const defaultConfig: LayoutConfig = {
  nodeSpacing: 50, // Vertical spacing between nodes in the same flow
  primaryWidth: 180, // Standardized width for all nodes
  primaryHeight: 70, // Standardized height for all nodes
  neutralWidth: 180,
  neutralHeight: 70,
  secondaryWidth: 180,
  secondaryHeight: 70,
  scale: 1,
};

const COLUMN_X_POSITIONS: ColumnPositions = {
  1: 50, // Column 1 (default for primary)
  2: 300, // Column 2 (default for neutral) - 50 + 180 + 70 gap
  3: 550, // Column 3 (default for secondary) - 300 + 180 + 70 gap
};

export const calculateLayout = (
  chartData: FlowChartData,
  config: Partial<LayoutConfig> = {},
  columnPositions?: Partial<ColumnPositions>
): LayoutResult => {
  const cfg = { ...defaultConfig, ...config };
  const columns = { ...COLUMN_X_POSITIONS, ...columnPositions };

  const nodes: PositionedNode[] = [];
  const connections: Connection[] = [];
  const nodeMap = new Map<string, PositionedNode>();
  const visited = new Set<string>();

  let maxX = 0;
  let maxY = 0;

  /**
   * Gets dimensions of a node in the flowchart. factors in scale
   */
  const getNodeDimensions = (node: FlowNode) => {
    switch (node.variant) {
      case 'primary':
        return { width: cfg.primaryWidth * cfg.scale, height: cfg.primaryHeight * cfg.scale };
      case 'neutral':
        return { width: cfg.neutralWidth * cfg.scale, height: cfg.neutralHeight * cfg.scale };
      case 'secondary':
        return { width: cfg.secondaryWidth * cfg.scale, height: cfg.secondaryHeight * cfg.scale };
    }
  };

  const getNodeColumn = (node: FlowNode): number => {
    // Column is now required on the node
    const columnNumber = node.column;
    // Get x-position for this column, default to column * 200 if not defined
    const xPosition = columns[columnNumber] ?? columnNumber * 200;
    return xPosition * cfg.scale;
  };

  // Check if a position would cause node overlap
  const hasCollision = (x: number, y: number, width: number, height: number): boolean => {
    const buffer = 15 * cfg.scale; // Minimum spacing between nodes

    for (const positioned of nodes) {
      // Check if rectangles overlap with buffer
      const noOverlapX =
        x + width + buffer <= positioned.x || positioned.x + positioned.width + buffer <= x;
      const noOverlapY =
        y + height + buffer <= positioned.y || positioned.y + positioned.height + buffer <= y;

      if (!noOverlapX && !noOverlapY) {
        return true;
      }
    }

    return false;
  };

  /**
   * Given coordinates x/y, check if another node collides with the one we are placing. Increase Y by 20 till we find an open spot.
   * @param x - y position to place the node
   * @param y - x position to place the node
   * @param width - width of the node
   * @param height - height of the node
   */
  const findAvailablePosition = (
    x: number,
    y: number,
    width: number,
    height: number
  ): { x: number; y: number } => {
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
  };

  const positionNode = (node: FlowNode, x: number, y: number): PositionedNode => {
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
  };

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

    const node = chartData.nodes.find((n) => n.id === nodeId);
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
      const targetNode = chartData.nodes.find((n) => n.id === conn.targetId);
      if (!targetNode) {
        console.error(
          `Node ${node.id}: connection references "${conn.targetId}" but node not found`
        );
        return;
      }

      const targetColumn = getNodeColumn(targetNode);
      const targetDims = getNodeDimensions(targetNode);

      // Determine connection sides and position
      let targetY: number;
      let fromSide: 'top' | 'right' | 'bottom' | 'left';
      let toSide: 'top' | 'right' | 'bottom' | 'left';

      // Check if explicit directions are provided in the connection
      if (conn.fromSide && conn.toSide) {
        // Use explicitly provided directions
        fromSide = conn.fromSide;
        toSide = conn.toSide;
        // Position target based on toSide
        if (toSide === 'top') {
          targetY = y + positioned.height + cfg.nodeSpacing * cfg.scale;
        } else if (toSide === 'bottom') {
          targetY = y - targetDims.height - cfg.nodeSpacing * cfg.scale;
        } else {
          // Horizontal entry - try to align at same level
          const sourceMidpoint = positioned.height / 2;
          const targetMidpoint = targetDims.height / 2;
          targetY = y + sourceMidpoint - targetMidpoint;
        }
      } else {
        // Automatic routing based on variants and positions
        // Calculate relative position of target
        const targetIsRight = targetColumn > column;
        const targetIsLeft = targetColumn < column;

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
          // Any → Primary: check actual position instead of assuming loop back
          if (targetIsRight) {
            // Target is to the right - horizontal connection
            const sourceMidpoint = positioned.height / 2;
            const targetMidpoint = targetDims.height / 2;
            targetY = y + sourceMidpoint - targetMidpoint;
            fromSide = 'right';
            toSide = 'left';
          } else if (targetIsLeft) {
            // Target is to the left - loop back pattern
            targetY = y + positioned.height + cfg.nodeSpacing * cfg.scale;
            fromSide = 'left';
            toSide = 'top';
          } else {
            // Same column - vertical connection
            targetY = y + positioned.height + cfg.nodeSpacing * cfg.scale;
            fromSide = 'bottom';
            toSide = 'top';
          }
        } else if (node.variant === 'secondary') {
          // Secondary → Any: check actual position
          if (targetIsRight) {
            // Target is to the right - horizontal connection
            const sourceMidpoint = positioned.height / 2;
            const targetMidpoint = targetDims.height / 2;
            targetY = y + sourceMidpoint - targetMidpoint;
            fromSide = 'right';
            toSide = 'left';
          } else {
            // Default vertical connection
            targetY = y + positioned.height + cfg.nodeSpacing * cfg.scale;
            fromSide = 'bottom';
            toSide = 'top';
          }
        } else {
          // Default: vertical connection
          targetY = y + positioned.height + cfg.nodeSpacing * cfg.scale;
          fromSide = 'bottom';
          toSide = 'top';
        }
      }

      layoutNode(conn.targetId, targetColumn, targetY, positioned, conn, fromSide, toSide);
    });
  }

  // Start layout from root - use column 1 as default starting position
  const rootNode = chartData.nodes.find((n) => n.id === chartData.rootId);
  const rootColumn = rootNode ? getNodeColumn(rootNode) : (columns[1] ?? 50) * cfg.scale;
  layoutNode(chartData.rootId, rootColumn, 50 * cfg.scale);

  // Calculate final dimensions
  const minWidth =
    (columns[3] ?? 550) * cfg.scale + cfg.secondaryWidth * cfg.scale + 100 * cfg.scale;
  const calculatedWidth = Math.max(maxX + 100 * cfg.scale, minWidth);

  return {
    nodes,
    connections,
    width: calculatedWidth,
    height: maxY + 100 * cfg.scale,
  };
};
