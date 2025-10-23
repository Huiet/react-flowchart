# FlowChart V2 - Unified Reference Model

## Overview

FlowChart V2 introduces a cleaner, more explicit approach to defining flowcharts with a **unified node structure**. Unlike V1 which had different properties per node type, V2 uses the same properties for all nodes.

## Key Improvements

### 1. Unified Node Structure
**Every node** (period, decision, outcome) uses the same navigation properties:

```typescript
interface FlowNode {
  id: string;
  type: 'period' | 'decision' | 'outcome';
  label: string;
  question?: string;  // Only for decisions

  // Unified navigation - any node can use any of these
  next?: string;      // Primary next node
  nextYes?: string;   // Yes path (mainly for decisions)
  nextNo?: string;    // No path (mainly for decisions)
}
```

### 2. All Nodes Defined Upfront
No nesting - all nodes are defined in a flat map:

```typescript
const chartData: FlowChartData = {
  rootId: 'start',
  nodes: {
    'start': { id: 'start', type: 'period', label: 'Start', next: 'decision-1' },
    'decision-1': { /* ... */ nextYes: 'outcome-yes', nextNo: 'outcome-no' },
    'outcome-yes': { /* ... */ next: 'next-period' },
    'outcome-no': { /* ... */ next: 'next-period' },  // Same target!
    'next-period': { /* ... */ },
  }
};
```

### 3. Multiple Parents Made Easy
Since nodes are referenced by ID, multiple nodes can point to the same target:

```typescript
'decision-2': {
  nextYes: 'outcome-payment',
  nextNo: 'period-2-3',  // Goes directly to period
},
'outcome-payment': {
  next: 'period-2-3',  // Also goes to same period!
}
```

### 4. Explicit References
Everything is explicit - no hidden nesting, no ambiguity:
- Want a decision's "no" path to go to a period? Set `nextNo: 'period-id'`
- Want an outcome to loop back? Set `next: 'earlier-period-id'`
- Want multiple paths to converge? Point them to the same node ID

## Usage

### Basic Example

```typescript
import { FlowChartV2 } from './components/FlowChartV2';
import type { FlowChartData } from './components/FlowChartV2';

const data: FlowChartData = {
  rootId: 'period-1',
  nodes: {
    'period-1': {
      id: 'period-1',
      type: 'period',
      label: 'Period 1',
      next: 'decision-1',
    },
    'decision-1': {
      id: 'decision-1',
      type: 'decision',
      label: '',
      question: 'Is condition met?',
      nextYes: 'outcome-yes',
      nextNo: 'outcome-no',
    },
    'outcome-yes': {
      id: 'outcome-yes',
      type: 'outcome',
      label: 'Success!',
    },
    'outcome-no': {
      id: 'outcome-no',
      type: 'outcome',
      label: 'Failed',
    },
  },
};

function MyComponent() {
  return (
    <FlowChartV2
      data={data}
      title="My Flowchart"
      subtitle="V2 Model"
    />
  );
}
```

### Complex Example: Branching Paths to Same Period

```typescript
const data: FlowChartData = {
  rootId: 'period-1',
  nodes: {
    'period-1': {
      id: 'period-1',
      type: 'period',
      label: 'Period 1',
      next: 'decision-1',
    },
    'decision-1': {
      id: 'decision-1',
      type: 'decision',
      question: 'Check condition A?',
      nextYes: 'outcome-a',
      nextNo: 'decision-2',
    },
    'outcome-a': {
      id: 'outcome-a',
      type: 'outcome',
      label: 'Outcome A',
      // Terminal - no next
    },
    'decision-2': {
      id: 'decision-2',
      type: 'decision',
      question: 'Check condition B?',
      nextYes: 'outcome-b',
      nextNo: 'period-2',  // ← Goes directly to period!
    },
    'outcome-b': {
      id: 'outcome-b',
      type: 'outcome',
      label: 'Outcome B',
      next: 'period-2',  // ← Also goes to period!
    },
    'period-2': {
      id: 'period-2',
      type: 'period',
      label: 'Period 2',
      // Both paths above converge here
    },
  },
};
```

## Layout Rules

Same column-based positioning as V1:
- **Left column**: Period nodes
- **Middle column**: Decision nodes
- **Right column**: Outcome nodes

## Connection Types

- **Period → Decision**: `right` → `left` (horizontal)
- **Decision → Outcome**: `right` → `left` (horizontal)
- **Decision → Decision**: `bottom` → `top` (vertical)
- **Decision → Period**: `bottom` → `top` (loop back)
- **Outcome → Period**: `bottom` → `top` (return to flow)
- **Outcome → Outcome**: `bottom` → `top` (vertical)

## Comparison with V1

| Feature | V1 | V2 |
|---------|----|----|
| Node properties | Different per type | Unified |
| Navigation | Nested objects | ID references |
| Multiple parents | Complex workaround | Natural |
| Direct links | Limited | Any to any |
| Data structure | Nested tree | Flat map |
| Flexibility | Moderate | High |

## Migration from V1

V1 and V2 are separate implementations - no migration needed. Choose based on your use case:

- **Use V1** if you prefer nested structures and simple flows
- **Use V2** if you need multiple parents, loops, or complex branching

Both support the same visual styles and layout rules.

## Demo

See `/flowchart-v2-demo` for a complete example demonstrating:
- Multiple paths converging to the same period
- Decision-to-period direct links
- Explicit node references
- Complex branching patterns
