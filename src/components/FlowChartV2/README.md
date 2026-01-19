# FlowChart V2 - Connection-Based Flow Component

## Overview

FlowChart V2 is a flexible React component for creating flowcharts with a **connection-based architecture**. Every node has a `connections` array that defines outgoing arrows with labels and colors.

## Core Concepts

### 1. Unified Node Structure

All nodes use the same interface regardless of their visual style:

```typescript
interface FlowNode {
  id: string;
  variant: 'primary' | 'neutral' | 'secondary'; // Visual styling
  label: string; // Display text
  column: number; // Horizontal position (1, 2, 3, etc.)
  connections: NodeConnection[]; // Outgoing arrows
  isActive?: boolean; // Highlight as active path
}
```

### 2. Connections Array

Navigation is handled through an array of connections:

```typescript
interface NodeConnection {
  targetId: string; // Destination node ID
  label?: string; // Text shown on arrow (e.g., "Yes", "No")
  color?: ConnectionColor; // Arrow color: 'green' | 'red' | 'blue' | 'orange' | 'default'
  fromSide?: 'top' | 'right' | 'bottom' | 'left'; // Exit side (auto-calculated if omitted)
  toSide?: 'top' | 'right' | 'bottom' | 'left'; // Entry side (auto-calculated if omitted)
}
```

### 3. Flat Array Structure

All nodes are defined in a flat array:

```typescript
const chartData: FlowChartData = {
  rootId: 'start',
  nodes: [
    {
      id: 'start',
      variant: 'primary',
      column: 1,
      label: 'Start',
      connections: [{ targetId: 'decision-1' }],
    },
    {
      id: 'decision-1',
      variant: 'neutral',
      column: 2,
      label: 'Check?',
      connections: [
        { targetId: 'outcome-yes', label: 'Yes', color: 'green' },
        { targetId: 'outcome-no', label: 'No', color: 'red' },
      ],
    },
    { id: 'outcome-yes', variant: 'secondary', column: 3, label: 'Success', connections: [] },
    { id: 'outcome-no', variant: 'secondary', column: 3, label: 'Failed', connections: [] },
  ],
};
```

### 4. Multiple Paths & Convergence

Multiple nodes can point to the same target, and nodes can loop back to earlier steps:

```typescript
{
  id: 'decision-2',
  connections: [
    { targetId: 'outcome-payment', label: 'Yes', color: 'green' },
    { targetId: 'period-3', label: 'No', color: 'red' }  // Skip to period
  ]
},
{
  id: 'outcome-payment',
  connections: [
    { targetId: 'period-3' }  // Both paths converge here
  ]
},
{
  id: 'fix-issues',
  connections: [
    { targetId: 'process-data', label: 'Retry', color: 'blue' }  // Loop back
  ]
}
```

## Usage

### Basic Import

```typescript
import { FlowChartV2 } from './components/FlowChartV2';
import type { FlowChartData } from './components/FlowChartV2';
```

### Simple Example

```typescript
const data: FlowChartData = {
  rootId: 'start',
  nodes: [
    {
      id: 'start',
      variant: 'primary',
      column: 1,
      label: 'Start Process',
      connections: [{ targetId: 'check' }],
    },
    {
      id: 'check',
      variant: 'neutral',
      column: 2,
      label: 'Is condition met?',
      connections: [
        { targetId: 'success', label: 'Yes', color: 'green' },
        { targetId: 'failed', label: 'No', color: 'red' },
      ],
    },
    {
      id: 'success',
      variant: 'secondary',
      column: 3,
      label: 'Success!',
      connections: [],  // Terminal node
    },
    {
      id: 'failed',
      variant: 'secondary',
      column: 3,
      label: 'Failed',
      connections: [],  // Terminal node
    },
  ],
};

function MyComponent() {
  return (
    <FlowChartV2
      data={data}
      title="My Flowchart"
      subtitle="Simple decision flow"
    />
  );
}
```

### Advanced Example: Multiple Paths with Loop-Back

```typescript
const complexData: FlowChartData = {
  rootId: 'intake',
  nodes: [
    {
      id: 'intake',
      variant: 'primary',
      column: 1,
      label: 'Receive\nRequest',
      connections: [{ targetId: 'validate' }],
    },
    {
      id: 'validate',
      variant: 'neutral',
      column: 2,
      label: 'Data\nValid?',
      connections: [
        { targetId: 'priority', label: 'Yes', color: 'green' },
        { targetId: 'fix-data', label: 'No', color: 'red' },
      ],
    },
    {
      id: 'fix-data',
      variant: 'secondary',
      column: 3,
      label: 'Fix\nIssues',
      connections: [
        { targetId: 'validate', label: 'Retry', color: 'blue' }, // Loop back!
      ],
    },
    {
      id: 'priority',
      variant: 'neutral',
      column: 2,
      label: 'Priority\nLevel?',
      connections: [
        { targetId: 'urgent', label: 'High', color: 'red' },
        { targetId: 'normal', label: 'Normal', color: 'blue' },
        { targetId: 'queue', label: 'Low', color: 'green' },
      ],
    },
    {
      id: 'urgent',
      variant: 'secondary',
      column: 3,
      label: 'Immediate\nProcessing',
      connections: [{ targetId: 'complete' }],
    },
    {
      id: 'normal',
      variant: 'secondary',
      column: 3,
      label: 'Standard\nProcessing',
      connections: [{ targetId: 'complete' }],
    },
    {
      id: 'queue',
      variant: 'secondary',
      column: 3,
      label: 'Queue for\nLater',
      connections: [{ targetId: 'complete' }],
    },
    {
      id: 'complete',
      variant: 'primary',
      column: 1,
      label: 'Completed',
      connections: [], // Multiple paths converge here
    },
  ],
};
```

## Component Props

```typescript
interface FlowChartV2Props {
  data: FlowChartData; // Required: chart data
  title?: string; // Optional: header title
  subtitle?: string; // Optional: header subtitle
  columnPositions?: Partial<ColumnPositions>; // Optional: custom column X positions
  scale?: number; // Optional: manual scale (0.5 to 2.0)
  maxWidth?: number; // Optional: auto-scale to fit width
}
```

### Example with Props

```typescript
<FlowChartV2
  data={chartData}
  title="Authentication Flow"
  subtitle="User login process"
  maxWidth={900}  // Auto-scale to fit 900px width
/>
```

## Node Variants

Variants control visual styling:

- **`primary`**: Dark blue background (#1e3a5f), white text
  - Use for: main stages, key milestones, starting/ending points
  - Default column: 1

- **`neutral`**: White background, dark text, blue border
  - Use for: decision points, questions, conditional logic
  - Default column: 2

- **`secondary`**: Light blue background (#e3f2fd), dark text
  - Use for: outcomes, results, intermediate steps
  - Default column: 3

**Important:** Variants are styling only. Use the `column` property to control positioning - any variant can appear in any column.

## Column Positioning

The `column` property determines horizontal placement:

```typescript
{
  id: 'quality-check',
  variant: 'neutral',  // White styling
  column: 1,           // But positioned in left column!
  label: 'Meets Standards?',
}
```

- Columns are numbered 1, 2, 3, etc. from left to right
- Default spacing: 300px between columns
- Customize with `columnPositions` prop: `columnPositions={{ 1: 0, 2: 400, 3: 800 }}`

## Connection Colors

Available colors for arrows and labels:

- **`green`** (#4CAF50): Yes/success paths
- **`red`** (#e74c3c): No/failure paths
- **`blue`** (#2196F3): Neutral/informational paths
- **`orange`** (#FF9800): Alternative/warning paths
- **`default`**: Uses default styling

```typescript
connections: [
  { targetId: 'success', label: 'Yes', color: 'green' },
  { targetId: 'failed', label: 'No', color: 'red' },
];
```

## Active Path Highlighting

Mark nodes as active to highlight the path taken through the flow:

```typescript
{
  id: 'process-data',
  variant: 'neutral',
  label: 'Process Data',
  connections: [{ targetId: 'validate' }],
  isActive: true,  // Highlight this node
}
```

**Visual Effects:**

- Active nodes: 4px border (vs 2px inactive)
- Inactive nodes: 40% opacity
- Active arrows: Full color with matching arrowhead
- Inactive arrows: Light gray (#cccccc)

## Arrow Routing

Arrows use Manhattan (perpendicular) routing with automatic collision avoidance:

- **Auto-calculated routing**: Arrows automatically choose exit/entry sides based on node positions
- **Manual control**: Use `fromSide` and `toSide` to explicitly control routing
- **Staggered connections**: Multiple arrows from the same side are automatically staggered
- **Perpendicular indicators**: Small perpendicular lines mark arrow origins

```typescript
connections: [
  {
    targetId: 'target-node',
    fromSide: 'bottom', // Force exit from bottom
    toSide: 'top', // Force entry from top
  },
];
```

## Key Features

✅ **Flexible connections**: Any node can connect to any other node
✅ **Multiple parents**: Many nodes can point to the same target
✅ **Loop-back support**: Arrows can point to earlier nodes for retry logic
✅ **Color-coded paths**: 4 colors + default for visual clarity
✅ **Active path highlighting**: Show which path was taken
✅ **Auto-scaling**: Fits to specified width automatically
✅ **Manual scaling**: 0.5x to 2.0x zoom control
✅ **Collision avoidance**: Smart routing through gutters between nodes
✅ **Staggered arrows**: Clean visualization of multiple connections
