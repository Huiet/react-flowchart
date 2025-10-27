export type NodeVariant = 'primary' | 'neutral' | 'secondary';

// Unified node structure - all nodes have the same properties
export interface FlowNode {
  id: string;
  variant: NodeVariant;  // Dictates the colors: primary, neutral, or secondary
  label: string;
  column?: number;       // Optional column position (1, 2, 3, etc.). Defaults based on variant: primary=1, neutral=2, secondary=3
  isActive?: boolean;    // Whether this node is on the active/taken path

  // Unified navigation properties - any node can link to any other node
  next?: string;         // Primary next node (used by primary, secondary, or single-path neutral nodes)
  nextYes?: string;      // Yes path (typically used by neutral nodes)
  nextNo?: string;       // No path (typically used by neutral nodes)
}

// Chart data structure
export interface FlowChartData {
  nodes: FlowNode[];
  rootId: string;
}

// Positioned node for rendering
export interface PositionedNode {
  node: FlowNode;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Connection between nodes
export interface Connection {
  from: PositionedNode;
  to: PositionedNode;
  label?: 'Yes' | 'No';
  fromSide: 'top' | 'right' | 'bottom' | 'left';
  toSide: 'top' | 'right' | 'bottom' | 'left';
  isActive?: boolean; // Whether this connection is on the active/taken path
}

// Layout configuration
export interface LayoutConfig {
  nodeSpacing: number;
  primaryWidth: number;
  primaryHeight: number;
  neutralWidth: number;
  neutralHeight: number;
  secondaryWidth: number;
  secondaryHeight: number;
  scale: number;
}

// Column positions
export interface ColumnPositions {
  [column: number]: number;  // Map column number to x-position
}

// Layout result
export interface LayoutResult {
  nodes: PositionedNode[];
  connections: Connection[];
  width: number;
  height: number;
}
