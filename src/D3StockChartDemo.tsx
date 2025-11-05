import { useState } from 'react';
import { D3StockChart } from './components/D3StockChart';
import type { UnderlierData, CustomAnnotation, ReferenceLine } from './components/D3StockChart';
import mockUnderlierData from './components/D3StockChart/mock-underlier-data.json';

export const D3StockChartDemo = () => {
  const [isLoading, setIsLoading] = useState(false);

  // Cast the imported JSON to the correct type
  const underliers = mockUnderlierData as UnderlierData[];

  // Custom annotations - mark specific events
  const customAnnotations: CustomAnnotation[] = [
    {
      id: 'product-launch',
      date: new Date(1734480000000), // December 18, 2024
      value: 2, // Percentage value
      label: 'Product Launch',
      color: '#ff6b6b',
      dotSize: 7,
    },
  ];

  // Reference lines
  const referenceLines: ReferenceLine[] = [
    {
      id: 'target-level',
      type: 'horizontal',
      value: 10,
      label: 'Target: 10%',
      color: '#00b894',
      strokeDashArray: '8,4',
    },
    {
      id: 'zero-line',
      type: 'horizontal',
      value: 0,
      label: 'Break Even',
      color: '#666',
      strokeDashArray: '8,4',
    },
    {
      id: 'q1-end',
      type: 'vertical',
      value: new Date(1743638400000), // March 31, 2025
      label: 'Q1 End',
      color: '#6c5ce7',
      strokeDashArray: '4,4',
    },
  ];

  return (
    <div style={{ padding: '40px', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h1 style={{ margin: 0, color: '#2c3e50' }}>
            D3 Stock Chart Demo - Underlier Performance
          </h1>
          <button
            onClick={() => setIsLoading(!isLoading)}
            style={{
              padding: '10px 20px',
              backgroundColor: isLoading ? '#ef4444' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s',
            }}
          >
            {isLoading ? 'Hide Loading' : 'Show Loading'}
          </button>
        </div>
        <p style={{ marginBottom: '30px', color: '#7f8c8d', fontSize: '14px' }}>
          Interactive performance chart showing percentage gains/losses over time
        </p>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', height: '600px' }}>
          <D3StockChart
            underliers={underliers}
            showMinMaxAnnotations={false}
            customAnnotations={customAnnotations}
            referenceLines={referenceLines}
            isPercentage={true}
            isLoading={isLoading}
          />
        </div>

        <div style={{ marginTop: '30px', padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2 style={{ marginBottom: '15px', color: '#2c3e50', fontSize: '18px' }}>
            Features
          </h2>
          <ul style={{ color: '#555', lineHeight: '1.8' }}>
            <li>
              <strong>Interactive Tooltip:</strong> Hover over the chart to see percentage values for
              all underliers at that point, with crosshair guides
            </li>
            <li>
              <strong>Date Range Selector:</strong> Choose from 1M, 3M, YTD, 1Y, 5Y, or
              All to view different time periods (buttons automatically disabled when not enough data)
            </li>
            <li>
              <strong>Custom Annotations:</strong> Colored dots with labels mark specific events.
              Hover near them to see their labels in the tooltip
            </li>
            <li>
              <strong>Toggle Lines:</strong> Click on underlier names in the legend to show/hide
              different performance lines
            </li>
            <li>
              <strong>Technical Indicators:</strong> Add SMA, EMA, and Bollinger Bands per line
              or globally via the indicator menu
            </li>
            <li>
              <strong>Reference Point:</strong> Click anywhere on the chart to set a reference point
              and see relative performance from that date
            </li>
            <li>
              <strong>Reference Lines:</strong> Horizontal lines show target levels,
              vertical lines mark important dates (shown in tooltip when hovering nearby)
            </li>
            <li>
              <strong>Draggable Legend:</strong> Drag the legend by its handle to reposition it anywhere on the chart
            </li>
          </ul>
        </div>

        <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107' }}>
          <h3 style={{ marginTop: 0, color: '#856404', fontSize: '16px' }}>
            💡 Try This
          </h3>
          <ul style={{ color: '#856404', lineHeight: '1.8', marginBottom: 0 }}>
            <li>Hover over the chart to see crosshairs and a tooltip with percentage values</li>
            <li>Click anywhere on the chart to set a reference point and see relative gains/losses</li>
            <li>Click date range buttons (1M, 3M, YTD, etc.) to change the time period</li>
            <li>Click on underlier names in the legend to toggle visibility</li>
            <li>Click the indicator icon to add technical indicators like SMA or Bollinger Bands</li>
            <li>Drag the legend by its handle to move it around the chart</li>
            <li>Hover near the "Product Launch" annotation or "Q1 End" vertical line to see them in the tooltip</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
