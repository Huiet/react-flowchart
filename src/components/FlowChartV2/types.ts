export type NodeVariant = 'primary' | 'neutral' | 'secondary';
export type ConnectionColor = 'green' | 'red' | 'blue' | 'orange' | 'default';

// Connection from a node to another node
export interface NodeConnection {
  targetId: string;
  label?: string;
  color?: ConnectionColor; // Also used as the active color for the arrow
}

// Unified node structure - all nodes have the same properties
export interface FlowNode {
  id: string;
  variant: NodeVariant;  // Dictates the colors: primary, neutral, or secondary
  label: string;
  column?: number;       // Optional column position (1, 2, 3, etc.). Defaults based on variant: primary=1, neutral=2, secondary=3
  isActive?: boolean;    // Whether this node is on the active/taken path
  connections: NodeConnection[]; // Array of outgoing connections
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
  label?: string;
  color?: ConnectionColor;
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
