import type {
  ColumnPositions,
  Connection,
  FlowChartData,
  FlowNode,
  FlowNodeRef,
  PositionedNode,
} from './types';

interface LayoutConfig {
  nodeSpacing: number;
  levelSpacing: number;
  periodWidth: number;
  periodHeight: number;
  decisionWidth: number;
  decisionHeight: number;
  outcomeWidth: number;
  outcomeHeight: number;
  branchSpacing: number;
}

const defaultConfig: LayoutConfig = {
  nodeSpacing: 50,
  levelSpacing: 100,
  periodWidth: 110,
  periodHeight: 50,
  decisionWidth: 180,
  decisionHeight: 70,
  outcomeWidth: 200,
  outcomeHeight: 60,
  branchSpacing: 220,
};

// Column-based X positions for different node types
const COLUMN_X_POSITIONS = {
  left: 50, // Period nodes (base/anchor)
  middle: 200, // Decision nodes (intermediary)
  right: 450, // Outcome nodes (terminal)
};

interface LayoutResult {
  nodes: PositionedNode[];
  connections: Connection[];
  width: number;
  height: number;
}

export function calculateLayout(
  rootNode: FlowNode,
  config: Partial<LayoutConfig> = {},
  columnPositions?: Partial<ColumnPositions>
): LayoutResult {
  const cfg = { ...defaultConfig, ...config };
  const columns = { ...COLUMN_X_POSITIONS, ...columnPositions };
  const nodes: PositionedNode[] = [];
  const connections: Connection[] = [];
  const nodeMap = new Map<string, PositionedNode>();

  let currentY = 50;
  let maxX = 0;
  let maxY = 0;

  function getNodeDimensions(node: FlowNode) {
    switch (node.type) {
      case 'period':
        return { width: cfg.periodWidth, height: cfg.periodHeight };
      case 'decision':
        return { width: cfg.decisionWidth, height: cfg.decisionHeight };
      case 'outcome':
        return { width: cfg.outcomeWidth, height: cfg.outcomeHeight };
    }
  }

  function positionNode(
    node: FlowNode,
    x: number,
    y: number,
    isYesBranch: boolean = false
  ): PositionedNode {
    // Check if already positioned
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

  function determineConnectionSides(
    from: PositionedNode,
    to: PositionedNode
  ): {
    fromSide: 'top' | 'right' | 'bottom' | 'left';
    toSide: 'top' | 'right' | 'bottom' | 'left';
  } {
    const fromCenterX = from.x + from.width / 2;
    const fromCenterY = from.y + from.height / 2;
    const toCenterX = to.x + to.width / 2;
    const toCenterY = to.y + to.height / 2;

    const dx = toCenterX - fromCenterX;
    const dy = toCenterY - fromCenterY;

    // Determine primary direction
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal movement is dominant
      if (dx > 0) {
        return { fromSide: 'right', toSide: 'left' };
      } else {
        return { fromSide: 'left', toSide: 'right' };
      }
    } else {
      // Vertical movement is dominant
      if (dy > 0) {
        return { fromSide: 'bottom', toSide: 'top' };
      } else {
        return { fromSide: 'top', toSide: 'bottom' };
      }
    }
  }

  function getNodeColumn(node: FlowNode, isTerminal: boolean = false): number {
    switch (node.type) {
      case 'period':
        return columns.left;
      case 'decision':
        return columns.middle;
      case 'outcome':
        // Terminal outcomes (no continuation) go to the right column
        // Non-terminal outcomes stay in middle column to continue flow
        return isTerminal ? columns.right : columns.middle;
      default:
        return columns.middle;
    }
  }

  function layoutTree(
    node: FlowNode | undefined,
    x: number,
    y: number,
    parentNode?: PositionedNode,
    connectionLabel?: 'Yes' | 'No',
    forceColumn?: number,
    explicitFromSide?: 'top' | 'right' | 'bottom' | 'left',
    explicitToSide?: 'top' | 'right' | 'bottom' | 'left'
  ) {
    if (!node) return;

    // Determine the X position based on node type and column rules
    const isTerminal = node.type === 'outcome' && !node.next;
    const finalX = forceColumn !== undefined ? forceColumn : getNodeColumn(node, isTerminal);

    const positioned = positionNode(node, finalX, y);

    if (parentNode) {
      // Use explicit sides if provided, otherwise auto-determine
      let fromSide = explicitFromSide;
      let toSide = explicitToSide;

      if (!fromSide || !toSide) {
        const sides = determineConnectionSides(parentNode, positioned);
        fromSide = explicitFromSide || sides.fromSide;
        toSide = explicitToSide || sides.toSide;
      }

      connections.push({
        from: parentNode,
        to: positioned,
        label: connectionLabel,
        fromSide,
        toSide,
      });
    }

    if (node.type === 'period') {
      // Period flows to next decision at middle column, at SAME Y level
      // Horizontal connection from right of period to left of decision
      layoutTree(
        node.next,
        columns.middle,
        y, // Same Y level as period
        positioned,
        undefined,
        undefined,
        'right',
        'left'
      );
    } else if (node.type === 'decision') {
      // Check if both yes and no are outcomes (branching case)
      const yesBranch = node.yesPath?.type === 'outcome';
      const noBranch = node.noPath?.type === 'outcome';
      const bothBranch = yesBranch && noBranch;

      // Decisions branch horizontally for Yes, vertically for No
      const yesY = y; // Yes path at same level as decision

      // Yes path - always at same Y level as the decision
      if (node.yesPath) {
        if (node.yesPath.type === 'outcome') {
          // Outcomes go to right column at same Y level
          // Connect from right side of decision to left side of outcome
          layoutTree(
            node.yesPath,
            columns.right,
            yesY,
            positioned,
            'Yes',
            columns.right,
            'right',
            'left'
          );
        } else {
          // Nested decisions stay in middle column at same level
          layoutTree(
            node.yesPath,
            columns.middle,
            yesY,
            positioned,
            'Yes',
            columns.middle,
            'bottom',
            'top'
          );
        }
      }

      // No path - positioned below the decision (cascading downward)
      if (node.noPath) {
        if (node.noPath.type === 'outcome') {
          // Outcomes go to right column, below the yes path outcome
          const outcomeOffset = yesBranch ? 70 : 0;
          // Connect from right side of decision to left side of outcome
          layoutTree(
            node.noPath,
            columns.right,
            y + outcomeOffset,
            positioned,
            'No',
            columns.right,
            'right',
            'left'
          );
        } else if (node.noPath.type === 'decision') {
          // Nested decisions go BELOW in middle column (cascading)
          const nextY = y + positioned.height + cfg.nodeSpacing;
          layoutTree(
            node.noPath,
            columns.middle,
            nextY,
            positioned,
            'No',
            columns.middle,
            'bottom',
            'top'
          );
        } else {
          // Other nodes continue down
          const nextY = y + positioned.height + cfg.nodeSpacing;
          layoutTree(
            node.noPath,
            columns.middle,
            nextY,
            positioned,
            'No',
            columns.middle,
            'bottom',
            'top'
          );
        }
      }
    } else if (node.type === 'outcome') {
      // Non-terminal outcome continues flow
      if (node.next) {
        const nextY = y + positioned.height + cfg.nodeSpacing;

        // Determine target column based on next node type
        let targetColumn: number;
        if (node.next.type === 'period') {
          targetColumn = columns.left;
        } else if (node.next.type === 'outcome') {
          targetColumn = columns.right; // Stay in outcome column
        } else {
          targetColumn = columns.middle; // Decision node
        }

        // Outcome to any node: always use bottom to top for clean paths
        layoutTree(
          node.next,
          targetColumn,
          nextY,
          positioned,
          undefined,
          targetColumn,
          'bottom',
          'top'
        );
      }
    }
  }

  layoutTree(rootNode, columns.left, currentY);

  // Calculate width based on rightmost column used plus padding
  const minWidth = columns.right + cfg.outcomeWidth + 100;
  const calculatedWidth = Math.max(maxX + 100, minWidth);

  return {
    nodes,
    connections,
    width: calculatedWidth,
    height: maxY + 100,
  };
}

// NEW: Calculate layout from reference-based model
export function calculateLayoutFromRefs(
  chartData: FlowChartData,
  config: Partial<LayoutConfig> = {},
  columnPositions?: Partial<ColumnPositions>
): LayoutResult {
  const cfg = { ...defaultConfig, ...config };
  const columns = { ...COLUMN_X_POSITIONS, ...columnPositions };
  const nodes: PositionedNode[] = [];
  const connections: Connection[] = [];
  const nodeMap = new Map<string, PositionedNode>();
  const visited = new Set<string>(); // Track visited nodes to avoid infinite loops

  let maxX = 0;
  let maxY = 0;

  function getNodeDimensions(node: FlowNodeRef) {
    switch (node.type) {
      case 'period':
        return { width: cfg.periodWidth, height: cfg.periodHeight };
      case 'decision':
        return { width: cfg.decisionWidth, height: cfg.decisionHeight };
      case 'outcome':
        return { width: cfg.outcomeWidth, height: cfg.outcomeHeight };
    }
  }

  function positionNode(node: FlowNodeRef, x: number, y: number): PositionedNode {
    // Check if already positioned
    if (nodeMap.has(node.id)) {
      return nodeMap.get(node.id)!;
    }

    const { width, height } = getNodeDimensions(node);

    // Convert FlowNodeRef to FlowNode for compatibility
    const flowNode: FlowNode = node as any; // Type coercion for now

    const positioned: PositionedNode = { node: flowNode, x, y, width, height };

    nodes.push(positioned);
    nodeMap.set(node.id, positioned);

    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);

    return positioned;
  }

  function getNodeColumn(node: FlowNodeRef): number {
    switch (node.type) {
      case 'period':
        return columns.left;
      case 'decision':
        return columns.middle;
      case 'outcome':
        return columns.right;
      default:
        return columns.middle;
    }
  }

  function determineConnectionSides(
    from: PositionedNode,
    to: PositionedNode
  ): {
    fromSide: 'top' | 'right' | 'bottom' | 'left';
    toSide: 'top' | 'right' | 'bottom' | 'left';
  } {
    const fromCenterX = from.x + from.width / 2;
    const fromCenterY = from.y + from.height / 2;
    const toCenterX = to.x + to.width / 2;
    const toCenterY = to.y + to.height / 2;

    const dx = toCenterX - fromCenterX;
    const dy = toCenterY - fromCenterY;

    // Determine primary direction
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal movement is dominant
      if (dx > 0) {
        return { fromSide: 'right', toSide: 'left' };
      } else {
        return { fromSide: 'left', toSide: 'right' };
      }
    } else {
      // Vertical movement is dominant
      if (dy > 0) {
        return { fromSide: 'bottom', toSide: 'top' };
      } else {
        return { fromSide: 'top', toSide: 'bottom' };
      }
    }
  }

  function layoutTree(
    nodeId: string | undefined,
    x: number,
    y: number,
    parentNode?: PositionedNode,
    connectionLabel?: 'Yes' | 'No',
    forceColumn?: number,
    explicitFromSide?: 'top' | 'right' | 'bottom' | 'left',
    explicitToSide?: 'top' | 'right' | 'bottom' | 'left'
  ) {
    if (!nodeId || visited.has(nodeId)) return;

    const node = chartData.nodes[nodeId];
    if (!node) return;

    // Mark as visited to prevent infinite loops
    visited.add(nodeId);

    // Determine the X position based on node type and column rules
    const finalX = forceColumn !== undefined ? forceColumn : getNodeColumn(node);

    const positioned = positionNode(node, finalX, y);

    if (parentNode) {
      // Use explicit sides if provided, otherwise auto-determine
      let fromSide = explicitFromSide;
      let toSide = explicitToSide;

      if (!fromSide || !toSide) {
        const sides = determineConnectionSides(parentNode, positioned);
        fromSide = explicitFromSide || sides.fromSide;
        toSide = explicitToSide || sides.toSide;
      }

      connections.push({
        from: parentNode,
        to: positioned,
        label: connectionLabel,
        fromSide,
        toSide,
      });
    }

    if (node.type === 'period') {
      // Period flows to next decision at middle column, at SAME Y level
      // Horizontal connection from right of period to left of decision
      layoutTree(
        node.next,
        columns.middle,
        y, // Same Y level as period
        positioned,
        undefined,
        undefined,
        'right',
        'left'
      );
    } else if (node.type === 'decision') {
      const yesNode = node.yesPath ? chartData.nodes[node.yesPath] : undefined;
      const noNode = node.noPath ? chartData.nodes[node.noPath] : undefined;

      const yesBranch = yesNode?.type === 'outcome';
      const noBranch = noNode?.type === 'outcome';

      const yesY = y; // Yes path at same level as decision

      // Yes path - always at same Y level as the decision
      if (node.yesPath && yesNode) {
        if (yesNode.type === 'outcome') {
          // Outcomes go to right column at same Y level
          // Connect from right side of decision to left side of outcome
          layoutTree(
            node.yesPath,
            columns.right,
            yesY,
            positioned,
            'Yes',
            columns.right,
            'right',
            'left'
          );
        } else {
          // Nested decisions stay in middle column at same level
          layoutTree(
            node.yesPath,
            columns.middle,
            yesY,
            positioned,
            'Yes',
            columns.middle,
            'bottom',
            'top'
          );
        }
      }

      // No path - positioned below the decision (cascading downward)
      if (node.noPath && noNode) {
        if (noNode.type === 'outcome') {
          // Outcomes go to right column, below the yes path outcome
          const outcomeOffset = yesBranch ? 70 : 0;
          // Connect from right side of decision to left side of outcome
          layoutTree(
            node.noPath,
            columns.right,
            y + outcomeOffset,
            positioned,
            'No',
            columns.right,
            'right',
            'left'
          );
        } else if (noNode.type === 'decision') {
          // Nested decisions go BELOW in middle column (cascading)
          const nextY = y + positioned.height + cfg.nodeSpacing;
          layoutTree(
            node.noPath,
            columns.middle,
            nextY,
            positioned,
            'No',
            columns.middle,
            'bottom',
            'top'
          );
        } else if (noNode.type === 'period') {
          // No path to period - use bottom-to-left for loop back
          const nextY = y + positioned.height + cfg.nodeSpacing;
          layoutTree(
            node.noPath,
            columns.left,
            nextY,
            positioned,
            'No',
            columns.left,
            'bottom',
            'top'
          );
        }
      }
    } else if (node.type === 'outcome') {
      // Non-terminal outcome continues flow
      if (node.next) {
        const nextNode = chartData.nodes[node.next];
        if (!nextNode) return;

        const nextY = y + positioned.height + cfg.nodeSpacing;

        // Determine target column based on next node type
        let targetColumn: number;
        if (nextNode.type === 'period') {
          targetColumn = columns.left;
        } else if (nextNode.type === 'outcome') {
          targetColumn = columns.right; // Stay in outcome column
        } else {
          targetColumn = columns.middle; // Decision node
        }

        // Outcome to any node: always use bottom to top for clean paths
        layoutTree(
          node.next,
          targetColumn,
          nextY,
          positioned,
          undefined,
          targetColumn,
          'bottom',
          'top'
        );
      }
    }
  }

  layoutTree(chartData.rootId, columns.left, 50);

  // Calculate width based on rightmost column used plus padding
  const minWidth = columns.right + cfg.outcomeWidth + 100;
  const calculatedWidth = Math.max(maxX + 100, minWidth);

  return {
    nodes,
    connections,
    width: calculatedWidth,
    height: maxY + 100,
  };
}
