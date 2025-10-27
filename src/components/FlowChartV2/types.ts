export type NodeType = 'start' | 'decision' | 'outcome';

// Unified node structure - all nodes have the same properties
export interface FlowNode {
  id: string;
  type: NodeType;
  label: string;
  isActive?: boolean; // Whether this node is on the active/taken path

  // Unified navigation properties - any node can link to any other node
  next?: string;      // Primary next node (used by start, outcome, or single-path decisions)
  nextYes?: string;   // Yes path (used by decisions)
  nextNo?: string;    // No path (used by decisions)
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
  startWidth: number;
  startHeight: number;
  decisionWidth: number;
  decisionHeight: number;
  outcomeWidth: number;
  outcomeHeight: number;
  scale: number;
}

// Column positions
export interface ColumnPositions {
  left: number;    // Start nodes
  middle: number;  // Decision nodes
  right: number;   // Outcome nodes
}

// Layout result
export interface LayoutResult {
  nodes: PositionedNode[];
  connections: Connection[];
  width: number;
  height: number;
}
