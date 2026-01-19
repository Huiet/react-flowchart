# Reference-Based FlowChart Model

## Overview

The FlowChart component now supports two data models:

1. **Nested Model** (Legacy): Nodes contain nested child nodes
2. **Reference-Based Model** (NEW): Nodes reference each other by ID

The reference-based model solves key limitations:

- ✅ **Multiple parents**: Multiple nodes can point to the same child node
- ✅ **Cycles/Loops**: Nodes can reference previously defined nodes
- ✅ **Infinite nesting**: No structural limitations on graph complexity
- ✅ **Cleaner data**: Separates node definitions from relationships

## Data Structure

### Reference-Based Model

```typescript
import type { FlowChartData } from './components/FlowChart';

const chartData: FlowChartData = {
  rootId: 'start-node', // ID of the first node to render
  nodes: {
    'start-node': {
      id: 'start-node',
      type: 'period',
      label: 'Start',
      next: 'decision-1', // Reference by ID
    },
    'decision-1': {
      id: 'decision-1',
      type: 'decision',
      question: 'Is condition met?',
      yesPath: 'outcome-yes', // Reference by ID
      noPath: 'outcome-no', // Reference by ID
    },
    'outcome-yes': {
      id: 'outcome-yes',
      type: 'outcome',
      label: 'Success!',
      next: 'next-period', // Both outcomes can point to same node!
    },
    'outcome-no': {
      id: 'outcome-no',
      type: 'outcome',
      label: 'Try again',
      next: 'next-period', // Same reference as above
    },
    'next-period': {
      id: 'next-period',
      type: 'period',
      label: 'Period 2',
      next: 'decision-2',
    },
    // ... more nodes
  },
};
```

### Usage

```tsx
import { FlowChart } from './components/FlowChart';

function MyComponent() {
  return (
    <FlowChart
      chartData={chartData} // Use chartData prop for reference-based
      title="My Flowchart"
      subtitle="Reference-based model"
    />
  );
}
```

## Node Types

### Period Node (Left Column)

```typescript
{
  id: 'period-1',
  type: 'period',
  label: 'Period 1',
  next: 'decision-1',  // Optional: ID of next node
}
```

### Decision Node (Middle Column)

```typescript
{
  id: 'decision-1',
  type: 'decision',
  label: '',  // Usually empty
  question: 'Question text here',
  yesPath: 'yes-outcome-id',  // Optional: ID of yes path
  noPath: 'no-path-id',       // Optional: ID of no path
}
```

### Outcome Node (Right Column)

```typescript
{
  id: 'outcome-1',
  type: 'outcome',
  label: 'Outcome description',
  next: 'next-node-id',  // Optional: ID of next node
}
```

## Key Features

### 1. Multiple Parents

Both yes and no paths can point to the same node:

```typescript
'decision-2': {
  yesPath: 'outcome-payment',
  noPath: 'period-2-3',  // Goes directly to period
},
'outcome-payment': {
  next: 'period-2-3',  // Also goes to same period!
}
```

### 2. Decision-to-Period Links

Decisions can now link directly to periods (not just through outcomes):

```typescript
'decision-1': {
  yesPath: 'outcome-1',
  noPath: 'period-2',  // Direct link to period
}
```

### 3. Cycle Prevention

The layout engine automatically prevents infinite loops by tracking visited nodes.

## Layout Rules

The layout engine maintains column-based positioning:

- **Left Column**: `period` nodes (base/anchor)
- **Middle Column**: `decision` nodes (intermediary)
- **Right Column**: `outcome` nodes (terminal or continuing)

### Connection Rules

- **Period → Decision**: `right` → `left` (horizontal)
- **Decision → Outcome**: `right` → `left` (horizontal)
- **Decision → Decision**: `bottom` → `top` (vertical cascade)
- **Decision → Period**: `bottom` → `top` (loop back)
- **Outcome → Period**: `bottom` → `top` (clean orthogonal path)
- **Outcome → Outcome**: `bottom` → `top` (vertical stack)

## Migration from Nested Model

The nested model is still supported for backward compatibility:

```typescript
// Old nested model still works
<FlowChart data={nestedFlowNode} />

// New reference-based model
<FlowChart chartData={referenceBasedData} />
```

To migrate:

1. Extract all nodes into a flat map with unique IDs
2. Replace nested objects with ID references
3. Define a `rootId` for the starting node
4. Use `chartData` prop instead of `data`

## Example

See `src/FlowChartDemo.tsx` for a complete example demonstrating:

- Yes/No branching where both paths lead to the same period
- Decision-to-period direct links
- Multiple periods with repeating patterns
