import { useState } from 'react';
import { D3StockChart } from './components/D3StockChart';
import type { StockLine, CustomAnnotation, ReferenceLine } from './components/D3StockChart';

// Generate sample stock data
const generateStockData = (
  startDate: Date,
  days: number,
  startPrice: number,
  volatility: number
) => {
  const data = [];
  let price = startPrice;

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    // Skip weekends for more realistic stock data
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      price += (Math.random() - 0.5) * volatility;
      data.push({
        date,
        value: Math.max(0, price), // Ensure price doesn't go negative
      });
    }
  }

  return data;
};

export const D3StockChartDemo = () => {
  const startDate = new Date('2024-01-01');

  // Generate stock data
  const aaplData = generateStockData(startDate, 180, 150, 5);
  const googlData = generateStockData(startDate, 180, 120, 4);
  const msftData = generateStockData(startDate, 180, 300, 8);

  // Initial stock lines
  const [lines, setLines] = useState<StockLine[]>([
    {
      id: 'aapl',
      name: 'AAPL',
      data: aaplData,
      color: '#0071e3',
      visible: true,
    },
    {
      id: 'googl',
      name: 'GOOGL',
      data: googlData,
      color: '#34a853',
      visible: true,
    },
    {
      id: 'msft',
      name: 'MSFT',
      data: msftData,
      color: '#f25022',
      visible: true,
    },
  ]);

  // Custom annotations - mark specific events using actual data points
  // Find data points around specific dates for annotations
  const findNearestDataPoint = (data: typeof aaplData, targetDate: Date) => {
    return data.reduce((nearest, point) => {
      const currentDiff = Math.abs(point.date.getTime() - targetDate.getTime());
      const nearestDiff = Math.abs(nearest.date.getTime() - targetDate.getTime());
      return currentDiff < nearestDiff ? point : nearest;
    });
  };

  // Find actual data points for annotations
  const event1Point = findNearestDataPoint(aaplData, new Date('2024-03-15'));
  const event2Point = findNearestDataPoint(googlData, new Date('2024-05-01'));

  const customAnnotations: CustomAnnotation[] = [
    {
      id: 'event1',
      date: event1Point.date,
      value: event1Point.value,
      label: 'Product Launch',
      color: '#ff6b6b',
      dotSize: 7,
    },
    {
      id: 'event2',
      date: event2Point.date,
      value: event2Point.value,
      label: 'Earnings Report',
      color: '#4ecdc4',
      dotSize: 7,
    },
  ];

  // Reference lines
  const referenceLines: ReferenceLine[] = [
    {
      id: 'target-price',
      type: 'horizontal',
      value: 160,
      label: 'Target Price: $160',
      color: '#00b894',
      strokeDashArray: '8,4',
    },
    {
      id: 'support-level',
      type: 'horizontal',
      value: 130,
      label: 'Support: $130',
      color: '#d63031',
      strokeDashArray: '8,4',
    },
    {
      id: 'quarter-end',
      type: 'vertical',
      value: new Date('2024-03-31'),
      label: 'Q1 End',
      color: '#6c5ce7',
      strokeDashArray: '4,4',
    },
  ];

  const handleLineToggle = (lineId: string, visible: boolean) => {
    console.log(`Line ${lineId} is now ${visible ? 'visible' : 'hidden'}`);
    setLines((prevLines) =>
      prevLines.map((line) =>
        line.id === lineId ? { ...line, visible } : line
      )
    );
  };

  return (
    <div style={{ padding: '40px', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '10px', color: '#2c3e50' }}>
          D3 Stock Chart Demo
        </h1>
        <p style={{ marginBottom: '30px', color: '#7f8c8d', fontSize: '14px' }}>
          Interactive stock chart with date range controls, annotations, and toggleable lines
        </p>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <D3StockChart
            lines={lines}
            width={1000}
            height={600}
            showMinMaxAnnotations={false}
            customAnnotations={customAnnotations}
            referenceLines={referenceLines}
            onLineToggle={handleLineToggle}
          />
        </div>

        <div style={{ marginTop: '30px', padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2 style={{ marginBottom: '15px', color: '#2c3e50', fontSize: '18px' }}>
            Features
          </h2>
          <ul style={{ color: '#555', lineHeight: '1.8' }}>
            <li>
              <strong>Interactive Tooltip:</strong> Hover over the chart to see values for
              all lines at that point, with crosshair guides
            </li>
            <li>
              <strong>Date Range Selector:</strong> Choose from 1W, 1M, 3M, YTD, 1Y, 5Y, or
              All to view different time periods (buttons automatically disabled when not enough data)
            </li>
            <li>
              <strong>Custom Annotations:</strong> Add colored dots with labels to mark specific events
              (e.g., Product Launch, Earnings Report shown in demo)
            </li>
            <li>
              <strong>Toggle Lines:</strong> Click on items in the legend to show/hide
              different stock lines
            </li>
            <li>
              <strong>Reference Lines:</strong> Horizontal lines show target price and
              support levels, vertical line marks Q1 end
            </li>
            <li>
              <strong>Interactive Legend:</strong> Located in the top-right corner, click
              to toggle line visibility
            </li>
          </ul>
        </div>

        <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107' }}>
          <h3 style={{ marginTop: 0, color: '#856404', fontSize: '16px' }}>
            💡 Try This
          </h3>
          <ul style={{ color: '#856404', lineHeight: '1.8', marginBottom: 0 }}>
            <li>Hover over the chart to see crosshairs and a tooltip with all values</li>
            <li>Click date range buttons (1W, 1M, 3M, etc.) to change the time period</li>
            <li>Click on line names in the legend to toggle visibility</li>
            <li>Try YTD to see year-to-date data, or 'All' for the complete history</li>
            <li>Notice the custom annotation points marking key events on the timeline</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
