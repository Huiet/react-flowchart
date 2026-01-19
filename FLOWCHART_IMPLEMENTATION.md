# FlowChart Implementation Guide

This document provides a complete overview of the FlowChart component implementation for creating dynamic, SVG-based flowcharts in React.

## 📁 File Structure

```
src/
├── components/
│   └── FlowChart/
│       ├── types.ts              # TypeScript type definitions
│       ├── Node.tsx              # Node rendering component
│       ├── Arrow.tsx             # Arrow/connector rendering
│       ├── layoutEngine.ts       # Automatic layout algorithm
│       ├── FlowChart.tsx         # Main SVG-based component (recommended)
│       ├── FlowChartD3.tsx       # D3.js alternative version
│       ├── example.tsx           # Example implementations
│       ├── index.ts              # Public exports
│       └── README.md             # Component documentation
├── FlowChartDemo.tsx             # Interactive demo application
└── FLOWCHART_IMPLEMENTATION.md   # This file
```

## 🚀 Quick Start

### 1. Basic Usage

```tsx
import { FlowChart } from './components/FlowChart';
import type { FlowNode } from './components/FlowChart';

const myFlow: FlowNode = {
  id: 'start',
  type: 'period',
  label: 'Start',
  next: {
    id: 'decision',
    type: 'decision',
    question: 'Is condition met?',
    yesPath: {
      id: 'success',
      type: 'outcome',
      label: 'Success!',
    },
    noPath: {
      id: 'failure',
      type: 'outcome',
      label: 'Failed',
    },
  },
};

function App() {
  return <FlowChart data={myFlow} title="My Process" />;
}
```

### 2. Run the Demo

To see all examples in action:

```tsx
import { FlowChartDemo } from './FlowChartDemo';

function App() {
  return <FlowChartDemo />;
}
```

## 🎨 Component Versions

### Pure SVG Version (Recommended)

**File:** `FlowChart.tsx`

**Pros:**

- ✅ No external dependencies
- ✅ Lightweight and fast
- ✅ Server-side rendering compatible
- ✅ Easy to customize
- ✅ Automatic layout calculation

**Best for:**

- Most use cases
- Static flowcharts
- Simple interactions
- Production applications

### D3.js Version (Optional)

**File:** `FlowChartD3.tsx`

**Pros:**

- ✅ Rich animation capabilities
- ✅ Built-in zoom/pan features
- ✅ Advanced path generators
- ✅ Integration with D3 ecosystem

**Cons:**

- ❌ Requires D3 dependency (~500KB)
- ❌ More complex setup
- ❌ Imperative API

**Best for:**

- Complex animations
- Interactive dashboards
- Data visualization suites
- Advanced D3 integrations

**Installation:**

```bash
npm install d3 @types/d3
```

## 📊 Data Structure

### Node Types

#### 1. Period Node

Represents a timeline period or process stage.

```typescript
{
  id: 'period-1',
  type: 'period',
  label: 'Period 1',
  next: { /* next node */ }
}
```

**Visual:** Dark blue rectangle with white text

#### 2. Decision Node

Represents a yes/no decision point.

```typescript
{
  id: 'decision-1',
  type: 'decision',
  question: 'Is condition met?',
  yesPath: { /* node for yes */ },
  noPath: { /* node for no */ }
}
```

**Visual:** White rectangle with black text, green/orange Yes/No indicators

#### 3. Outcome Node

Represents a result or action.

```typescript
{
  id: 'outcome-1',
  type: 'outcome',
  label: 'Result description',
  next: { /* optional next node */ }
}
```

**Visual:** Light blue rectangle with black text

### Multi-line Text

Use `\n` to create line breaks:

```typescript
{
  type: 'outcome',
  label: 'Payment of 8.68%\ncoupon (3 monthly)'
}
```

## 🎯 Real-World Examples

### 1. Luma Financial Product

The complete implementation matching your image:

```tsx
import { LumaFlowChartExample } from './components/FlowChart/example';

<LumaFlowChartExample />;
```

### 2. Approval Workflow

```tsx
const approvalFlow: FlowNode = {
  id: 'submit',
  type: 'period',
  label: 'Submit Request',
  next: {
    id: 'manager-review',
    type: 'decision',
    question: 'Manager\napproved?',
    yesPath: {
      id: 'approved',
      type: 'outcome',
      label: 'Request Approved',
    },
    noPath: {
      id: 'rejected',
      type: 'outcome',
      label: 'Request Rejected',
    },
  },
};
```

### 3. Nested Decisions

```tsx
const complexFlow: FlowNode = {
  id: 'start',
  type: 'period',
  label: 'Start',
  next: {
    id: 'check1',
    type: 'decision',
    question: 'First check?',
    yesPath: {
      id: 'check2',
      type: 'decision',
      question: 'Second check?',
      yesPath: {
        id: 'success',
        type: 'outcome',
        label: 'All checks passed',
      },
      noPath: {
        id: 'partial',
        type: 'outcome',
        label: 'Partially successful',
      },
    },
    noPath: {
      id: 'fail',
      type: 'outcome',
      label: 'Failed first check',
    },
  },
};
```

## 🛠️ Customization Guide

### Styling Nodes

Edit `src/components/FlowChart/Node.tsx`:

```typescript
const getNodeStyle = () => {
  switch (node.type) {
    case 'period':
      return {
        fill: '#1e3a5f', // Change background
        stroke: '#1e3a5f', // Change border
        textColor: '#ffffff', // Change text color
      };
    // ... other types
  }
};
```

### Adjusting Layout

Edit `src/components/FlowChart/layoutEngine.ts`:

```typescript
const defaultConfig = {
  nodeSpacing: 80, // Vertical space between nodes
  levelSpacing: 150, // Unused (legacy)
  periodWidth: 120, // Period node width
  periodHeight: 60, // Period node height
  decisionWidth: 200, // Decision node width
  decisionHeight: 80, // Decision node height
  outcomeWidth: 220, // Outcome node width
  outcomeHeight: 70, // Outcome node height
  branchSpacing: 250, // Horizontal spacing for branches
};
```

### Customizing Arrows

Edit `src/components/FlowChart/Arrow.tsx`:

```typescript
// Change line style
<path stroke="#333333" strokeWidth="2" ... />

// Change Yes/No colors
<circle fill={label === 'Yes' ? '#4CAF50' : '#FF9800'} ... />

// Adjust arrow path algorithm in createPath()
```

### Adding Custom Node Types

1. **Add to types:**

```typescript
// types.ts
export interface CustomNode extends BaseNode {
  type: 'custom';
  customData: string;
  next?: FlowNode;
}

export type FlowNode = PeriodNode | DecisionNode | OutcomeNode | CustomNode;
```

2. **Handle in Node.tsx:**

```typescript
case 'custom':
  return {
    fill: '#custom-color',
    stroke: '#custom-border',
    textColor: '#custom-text',
  };
```

3. **Update layout engine:**

```typescript
case 'custom':
  return { width: cfg.customWidth, height: cfg.customHeight };
```

## 🎨 Styling Integration

### With CSS Modules

```tsx
import styles from './FlowChart.module.css';

<FlowChart data={myFlow} className={styles.flowChart} />;
```

### With Tailwind CSS

```tsx
<div className="bg-gray-100 p-8 rounded-lg shadow-lg">
  <FlowChart data={myFlow} />
</div>
```

### With Styled Components

```tsx
import styled from 'styled-components';

const FlowChartContainer = styled.div`
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
`;

<FlowChartContainer>
  <FlowChart data={myFlow} />
</FlowChartContainer>;
```

## 🚀 Advanced Features

### Dynamic Data Updates

```tsx
function DynamicFlow() {
  const [flowData, setFlowData] = useState(initialFlow);

  const updateFlow = () => {
    setFlowData(newFlowConfig);
  };

  return <FlowChart data={flowData} />;
}
```

### Export as Image

```tsx
function ExportableFlow() {
  const svgRef = useRef<SVGSVGElement>(null);

  const exportAsPNG = () => {
    const svgElement = svgRef.current;
    if (!svgElement) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const data = new XMLSerializer().serializeToString(svgElement);
    const img = new Image();
    const svg = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svg);

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        const link = document.createElement('a');
        link.download = 'flowchart.png';
        link.href = URL.createObjectURL(blob!);
        link.click();
      });
    };

    img.src = url;
  };

  return (
    <>
      <button onClick={exportAsPNG}>Export as PNG</button>
      <FlowChart data={flowData} />
    </>
  );
}
```

## 📱 Responsive Design

The FlowChart is SVG-based and scales automatically. For container responsiveness:

```tsx
<div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
  <FlowChart data={myFlow} />
</div>
```

Or with scroll:

```tsx
<div style={{ width: '100%', overflow: 'auto' }}>
  <FlowChart data={myFlow} />
</div>
```

## 🐛 Troubleshooting

### Nodes Overlapping

Increase spacing in `layoutEngine.ts`:

```typescript
nodeSpacing: 100,        // Increase from 80
branchSpacing: 300,      // Increase from 250
```

### Text Truncated

Increase node dimensions:

```typescript
decisionWidth: 250,      // Increase from 200
outcomeHeight: 90,       // Increase from 70
```

### Arrows Not Showing

Ensure marker is defined:

```tsx
<defs>
  <marker id="arrowhead" ...>
</defs>
```

And referenced:

```tsx
<path markerEnd="url(#arrowhead)" ... />
```

## 🎓 Best Practices

1. **Unique IDs**: Always use unique IDs for each node
2. **Reasonable Depth**: Limit nesting to 5-6 levels for readability
3. **Text Length**: Keep labels concise (2-3 lines max)
4. **Testing**: Test with simple flows before building complex ones
5. **Performance**: For 50+ nodes, consider pagination or filtering

## 📄 License

MIT - Feel free to use in personal and commercial projects.

## 🤝 Contributing

To extend this component:

1. Add new node types in `types.ts`
2. Update rendering in `Node.tsx`
3. Modify layout logic in `layoutEngine.ts`
4. Add examples in `example.tsx`
5. Update documentation

## 📚 Additional Resources

- See `README.md` in the FlowChart directory for detailed API docs
- See `example.tsx` for complete working examples
- Run `FlowChartDemo` for interactive demonstrations
- Check TypeScript types for full interface definitions
