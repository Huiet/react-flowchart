export type NodeType = 'period' | 'decision' | 'outcome';

// Reference-based node types (use node IDs instead of nested objects)
export interface BaseNodeRef {
  id: string;
  type: NodeType;
  label: string;
}

export interface PeriodNodeRef extends BaseNodeRef {
  type: 'period';
  next?: string; // ID reference to next node
}

export interface DecisionNodeRef extends BaseNodeRef {
  type: 'decision';
  question: string;
  yesPath?: string; // ID reference to yes path node
  noPath?: string; // ID reference to no path node
}

export interface OutcomeNodeRef extends BaseNodeRef {
  type: 'outcome';
  next?: string; // ID reference to next node
}

export type FlowNodeRef = PeriodNodeRef | DecisionNodeRef | OutcomeNodeRef;

// Map of all nodes by ID
export interface FlowChartData {
  nodes: Record<string, FlowNodeRef>;
  rootId: string; // ID of the starting node
}

// Legacy nested node types (for backward compatibility)
export interface BaseNode {
  id: string;
  type: NodeType;
  label: string;
}

export interface PeriodNode extends BaseNode {
  type: 'period';
  next?: FlowNode;
}

export interface DecisionNode extends BaseNode {
  type: 'decision';
  question: string;
  yesPath?: FlowNode;
  noPath?: FlowNode;
}

export interface OutcomeNode extends BaseNode {
  type: 'outcome';
  next?: FlowNode;
}

export type FlowNode = PeriodNode | DecisionNode | OutcomeNode;

export interface PositionedNode {
  node: FlowNode;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Connection {
  from: PositionedNode;
  to: PositionedNode;
  label?: 'Yes' | 'No';
  fromSide?: 'top' | 'right' | 'bottom' | 'left';
  toSide?: 'top' | 'right' | 'bottom' | 'left';
}

export interface ColumnPositions {
  left: number;    // X position for Period nodes (base/anchor nodes)
  middle: number;  // X position for Decision nodes (intermediary nodes)
  right: number;   // X position for terminal Outcome nodes
}
