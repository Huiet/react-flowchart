# FlowChart Component

A dynamic, SVG-based flowchart component for React that supports conditional branching, multiple node types, and automatic layout.

## Features

- **Pure SVG rendering** - Crisp graphics at any zoom level
- **Dynamic configuration** - Define flowcharts using simple nested objects
- **Multiple node types**:
  - `period` - Dark blue boxes for timeline periods
  - `decision` - White boxes for yes/no questions
  - `outcome` - Light blue boxes for results
- **Automatic layout** - No manual positioning required
- **Yes/No branching** - Visual indicators with colored circles
- **TypeScript support** - Full type safety

## Installation

Copy the `FlowChart` directory into your project's components folder.

## Basic Usage

```tsx
import { FlowChart } from './components/FlowChart';
import type { FlowNode } from './components/FlowChart';

const flowData: FlowNode = {
  id: 'start',
  type: 'period',
  label: 'Start',
  next: {
    id: 'decision1',
    type: 'decision',
    label: '',
    question: 'Is condition met?',
    yesPath: {
      id: 'success',
      type: 'outcome',
      label: 'Success!',
    },
    noPath: {
      id: 'failure',
      type: 'outcome',
      label: 'Try again',
    },
  },
};

function App() {
  return (
    <FlowChart
      data={flowData}
      title="My Process Flow"
      subtitle="Version 1.0"
    />
  );
}
```

## Data Structure

### FlowNode Types

#### PeriodNode
Represents a time period or process stage.

```typescript
{
  id: string;           // Unique identifier
  type: 'period';
  label: string;        // Display text (supports \n for line breaks)
  next?: FlowNode;      // Next node in the flow
}
```

#### DecisionNode
Represents a yes/no decision point.

```typescript
{
  id: string;
  type: 'decision';
  label: string;        // Usually empty for decisions
  question: string;     // The question to display (supports \n)
  yesPath?: FlowNode;   // Node to follow if yes
  noPath?: FlowNode;    // Node to follow if no
}
```

#### OutcomeNode
Represents a result or outcome.

```typescript
{
  id: string;
  type: 'outcome';
  label: string;        // Outcome description (supports \n)
  next?: FlowNode;      // Optional next step
}
```

## Advanced Example

See `example.tsx` for a complete implementation of the Luma financial product flowchart.

```tsx
import { LumaFlowChartExample } from './components/FlowChart/example';

function App() {
  return <LumaFlowChartExample />;
}
```

## Customization

### Node Styling

Edit `Node.tsx` to customize colors, fonts, and sizes:

```typescript
// In Node.tsx
const getNodeStyle = () => {
  switch (node.type) {
    case 'period':
      return {
        fill: '#1e3a5f',      // Background color
        stroke: '#1e3a5f',    // Border color
        textColor: '#ffffff',  // Text color
      };
    // ... other types
  }
};
```

### Layout Configuration

Modify spacing and dimensions in `layoutEngine.ts`:

```typescript
const defaultConfig = {
  nodeSpacing: 80,        // Vertical space between nodes
  levelSpacing: 150,      // Horizontal space for branches
  periodWidth: 120,
  periodHeight: 60,
  decisionWidth: 200,
  decisionHeight: 80,
  outcomeWidth: 220,
  outcomeHeight: 70,
  branchSpacing: 250,     // Space for yes/no branches
};
```

### Arrow Styling

Edit `Arrow.tsx` to customize connectors:

```typescript
// Change arrow color
<path stroke="#333333" strokeWidth="2" ... />

// Change Yes/No indicator colors
fill={label === 'Yes' ? '#4CAF50' : '#FF9800'}
```

## Multi-line Text

Use `\n` in label or question strings to create line breaks:

```typescript
{
  type: 'outcome',
  label: 'Payment of 8.68%\ncoupon (3 monthly)',
}
```

## Tips

1. **Keep IDs unique** - Each node needs a unique `id` to prevent rendering issues
2. **Test with simple flows first** - Start with 2-3 nodes before building complex flows
3. **Use line breaks wisely** - Break long text across multiple lines for readability
4. **Check the layout** - If nodes overlap, adjust spacing in `layoutEngine.ts`

## Component Props

### FlowChart

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| data | FlowNode | Yes | The root node of your flowchart |
| title | string | No | Header title |
| subtitle | string | No | Header subtitle (right-aligned) |
| className | string | No | Additional CSS classes |

## Browser Support

Works in all modern browsers that support SVG (IE11+, Chrome, Firefox, Safari, Edge).

## License

MIT
