export type NodeType = 'period' | 'decision' | 'outcome';

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
