# FlowChart Quick Start

## ⚡ 30-Second Start

```tsx
import { FlowChart } from './components/FlowChart';

const flow = {
  id: '1',
  type: 'period',
  label: 'Start',
  next: {
    id: '2',
    type: 'decision',
    question: 'Ready?',
    yesPath: { id: '3', type: 'outcome', label: 'Go!' },
    noPath: { id: '4', type: 'outcome', label: 'Wait' },
  },
};

<FlowChart data={flow} title="My Flow" />;
```

## 🎨 Node Type Reference

| Type       | Visual         | Use For          | Properties                                      |
| ---------- | -------------- | ---------------- | ----------------------------------------------- |
| `period`   | Dark blue box  | Timeline stages  | `id`, `type`, `label`, `next?`                  |
| `decision` | White box      | Yes/No questions | `id`, `type`, `question`, `yesPath?`, `noPath?` |
| `outcome`  | Light blue box | Results/Actions  | `id`, `type`, `label`, `next?`                  |

## 📝 Common Patterns

### Simple Linear Flow

```tsx
{
  id: 'a',
  type: 'period',
  label: 'Step 1',
  next: {
    id: 'b',
    type: 'period',
    label: 'Step 2',
    next: {
      id: 'c',
      type: 'outcome',
      label: 'Done'
    }
  }
}
```

### Single Decision

```tsx
{
  id: 'start',
  type: 'period',
  label: 'Start',
  next: {
    id: 'check',
    type: 'decision',
    question: 'Condition met?',
    yesPath: {
      id: 'yes',
      type: 'outcome',
      label: 'Success'
    },
    noPath: {
      id: 'no',
      type: 'outcome',
      label: 'Failure'
    }
  }
}
```

### Nested Decisions

```tsx
{
  id: 'start',
  type: 'period',
  label: 'Begin',
  next: {
    id: 'first',
    type: 'decision',
    question: 'First check?',
    yesPath: {
      id: 'second',
      type: 'decision',
      question: 'Second check?',
      yesPath: { id: 'win', type: 'outcome', label: 'Both passed' },
      noPath: { id: 'partial', type: 'outcome', label: 'One passed' }
    },
    noPath: { id: 'fail', type: 'outcome', label: 'Failed' }
  }
}
```

### Continuing After Outcome

```tsx
{
  id: 'decide',
  type: 'decision',
  question: 'Approved?',
  yesPath: {
    id: 'process',
    type: 'outcome',
    label: 'Processing',
    next: {
      id: 'complete',
      type: 'outcome',
      label: 'Complete'
    }
  },
  noPath: { id: 'reject', type: 'outcome', label: 'Rejected' }
}
```

## 🎯 Props Quick Reference

```tsx
<FlowChart
  data={flowNode} // Required: Your flow data
  title="Flow Title" // Optional: Header title
  subtitle="Version 1.0" // Optional: Header subtitle
  className="custom-class" // Optional: CSS class
/>
```

## 💡 Tips

### Multi-line Text

Use `\n` for line breaks:

```tsx
label: 'Line 1\nLine 2\nLine 3';
```

### Unique IDs

Every node needs a unique ID:

```tsx
// ✅ Good
{ id: 'period-1', ... }
{ id: 'decision-1', ... }
{ id: 'outcome-1', ... }

// ❌ Bad
{ id: '1', ... }
{ id: '1', ... }  // Duplicate!
```

### Optional Paths

Not all paths are required:

```tsx
{
  type: 'decision',
  question: 'Continue?',
  yesPath: { ... },  // Required for decisions
  // noPath omitted - that's OK!
}
```

## 🎨 Quick Customization

### Change Colors

Edit `Node.tsx`:

```tsx
case 'period':
  return { fill: '#YOUR_COLOR' };
```

### Change Spacing

Edit `layoutEngine.ts`:

```tsx
nodeSpacing: 100,    // Space between nodes
branchSpacing: 300,  // Space for yes/no branches
```

### Change Sizes

Edit `layoutEngine.ts`:

```tsx
periodWidth: 150,
periodHeight: 70,
```

## 🚀 Next Steps

1. ✅ Try the `FlowChartDemo` component
2. ✅ Copy an example from `example.tsx`
3. ✅ Read full docs in `README.md`
4. ✅ Check implementation guide in `FLOWCHART_IMPLEMENTATION.md`

## 🆘 Quick Fixes

**Nodes overlapping?**
→ Increase `nodeSpacing` and `branchSpacing`

**Text cut off?**
→ Increase node width/height in `layoutEngine.ts`

**Arrows missing?**
→ Check that `<defs>` with marker is in SVG

**TypeScript errors?**
→ Import types: `import type { FlowNode } from './types'`

## 📦 Files You Need

Minimum files to copy:

- `types.ts`
- `Node.tsx`
- `Arrow.tsx`
- `layoutEngine.ts`
- `FlowChart.tsx`
- `index.ts`

That's it! 🎉
