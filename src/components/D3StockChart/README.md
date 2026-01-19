# D3StockChart

A feature-rich, interactive stock market chart component built with D3.js and React.

## Features

✅ **Interactive Tooltip** - Hover to see all line values with crosshair guides
✅ **Date Range Selector** - Quick buttons for 1W, 1M, 3M, YTD, 1Y, 5Y, and All
✅ **Custom Annotations** - Add colored dots with labels to mark important points
✅ **Toggle Line Visibility** - Show/hide lines via interactive legend
✅ **Reference Lines** - Add horizontal and vertical lines with labels
✅ **Responsive** - Configurable width, height, and margins
✅ **TypeScript** - Fully typed for better developer experience

## Installation

```bash
npm install d3 @types/d3
```

## Basic Usage

```tsx
import { D3StockChart } from './components/D3StockChart';
import type { StockLine } from './components/D3StockChart';

const MyChart = () => {
  const lines: StockLine[] = [
    {
      id: 'aapl',
      name: 'AAPL',
      data: [
        { date: new Date('2024-01-01'), value: 150 },
        { date: new Date('2024-01-02'), value: 152 },
        // ... more data points
      ],
      color: '#0071e3',
      visible: true,
    },
  ];

  return <D3StockChart lines={lines} />;
};
```

## Props

### D3StockChartProps

| Prop                    | Type                                         | Default                                       | Description                                                     |
| ----------------------- | -------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------- |
| `lines`                 | `StockLine[]`                                | Required                                      | Array of line data to display                                   |
| `width`                 | `number`                                     | `800`                                         | Chart width in pixels                                           |
| `height`                | `number`                                     | `500`                                         | Chart height in pixels                                          |
| `margins`               | `ChartMargins`                               | `{top: 20, right: 120, bottom: 70, left: 60}` | Chart margins                                                   |
| `showMinMaxAnnotations` | `boolean`                                    | `true`                                        | (Deprecated - no longer used)                                   |
| `customAnnotations`     | `CustomAnnotation[]`                         | `[]`                                          | Custom annotation points                                        |
| `referenceLines`        | `ReferenceLine[]`                            | `[]`                                          | Horizontal/vertical reference lines                             |
| `onLineToggle`          | `(lineId: string, visible: boolean) => void` | `undefined`                                   | Callback when line visibility changes                           |
| `defaultDateRange`      | `DateRange`                                  | `'ALL'`                                       | Initial date range ('1W', '1M', '3M', 'YTD', '1Y', '5Y', 'ALL') |

### StockLine

```typescript
interface StockLine {
  id: string; // Unique identifier
  name: string; // Display name in legend
  data: StockDataPoint[]; // Array of {date, value} points
  color: string; // Line color (hex, rgb, etc.)
  visible: boolean; // Initial visibility
}
```

### CustomAnnotation

```typescript
interface CustomAnnotation {
  id: string; // Unique identifier
  date: Date; // X-axis position
  value: number; // Y-axis position
  label: string; // Text label
  color: string; // Dot color
  dotSize?: number; // Dot radius (default: 6)
}
```

### ReferenceLine

```typescript
interface ReferenceLine {
  id: string; // Unique identifier
  type: 'horizontal' | 'vertical'; // Line orientation
  value: number | Date; // Position (number for horizontal, Date for vertical)
  label: string; // Text label
  color?: string; // Line color (default: '#666')
  strokeDashArray?: string; // Dash pattern (default: '5,5')
}
```

## Advanced Example

```tsx
import { D3StockChart } from './components/D3StockChart';
import type { CustomAnnotation, ReferenceLine, StockLine } from './components/D3StockChart';

const AdvancedChart = () => {
  const lines: StockLine[] = [
    {
      id: 'stock1',
      name: 'Stock 1',
      data: generateData(), // Your data generation function
      color: '#0071e3',
      visible: true,
    },
    {
      id: 'stock2',
      name: 'Stock 2',
      data: generateData(),
      color: '#34a853',
      visible: true,
    },
  ];

  const customAnnotations: CustomAnnotation[] = [
    {
      id: 'event1',
      date: new Date('2024-03-15'),
      value: 155,
      label: 'Product Launch',
      color: '#ff6b6b',
      dotSize: 8,
    },
  ];

  const referenceLines: ReferenceLine[] = [
    {
      id: 'target',
      type: 'horizontal',
      value: 160,
      label: 'Target: $160',
      color: '#00b894',
      strokeDashArray: '8,4',
    },
    {
      id: 'quarter-end',
      type: 'vertical',
      value: new Date('2024-03-31'),
      label: 'Q1 End',
      color: '#6c5ce7',
    },
  ];

  const handleLineToggle = (lineId: string, visible: boolean) => {
    console.log(`Line ${lineId} toggled to ${visible}`);
  };

  return (
    <D3StockChart
      lines={lines}
      width={1000}
      height={600}
      customAnnotations={customAnnotations}
      referenceLines={referenceLines}
      onLineToggle={handleLineToggle}
    />
  );
};
```

## Interactions

### Tooltip & Crosshair

- **Hover**: Move your mouse over the chart to see a tooltip with values for all visible lines
- **Crosshair**: Horizontal and vertical guide lines appear to help pinpoint the exact position
- **Dynamic Updates**: Tooltip automatically finds the nearest data point for each line
- **Multi-line Support**: Shows all visible line values in a single tooltip
- **Persistent Display**: Crosshair stays visible when mouse stops moving

### Date Range Selector

- **Quick Selection**: Click buttons to instantly switch between time periods
- **Smart Availability**: Buttons are automatically disabled if there isn't enough data for that range
- **Available Ranges**:
  - `1W` - Last 7 days (requires at least 7 days of data)
  - `1M` - Last month (requires at least 30 days of data)
  - `3M` - Last 3 months (requires at least 90 days of data)
  - `YTD` - Year to date (requires data back to January 1)
  - `1Y` - Last year (requires at least 365 days of data)
  - `5Y` - Last 5 years (requires at least 5 years of data)
  - `All` - Complete data history (always available)
- **Dynamic Filtering**: Data and annotations update automatically for the selected range
- **Scale Adjustment**: Chart scales adjust to fit the visible data optimally
- **Tooltip Feedback**: Hover over disabled buttons to see why they're unavailable

### Legend

- Click on any line name in the legend to toggle its visibility
- Disabled lines appear faded in the legend
- Chart automatically adjusts scales when lines are hidden
- Tooltip automatically excludes hidden lines
- Date range filtering applies only to visible lines

## Styling

The component uses CSS modules. You can customize styles by:

1. Modifying `D3StockChart.module.css`
2. Overriding global D3 classes:
   - `.axis` - Axis styling
   - `.grid` - Grid lines
   - `.line` - Data lines
   - `.annotation-text` - Annotation labels
   - `.reference-line` - Reference lines

## Performance Tips

- For large datasets (>1000 points), consider downsampling data
- Limit the number of visible lines to 5-10 for best performance
- Use `React.memo()` if re-rendering is expensive
- Debounce zoom events for very large datasets

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- IE11: ❌ Not supported (requires D3 v7+)

## License

MIT
