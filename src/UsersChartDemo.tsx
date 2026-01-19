import { useState } from 'react';
import { UsersChart } from './components/UsersChart';
import type { DataPoint, Series } from './components/UsersChart';

export const UsersChartDemo = () => {
  const [isLoading, setIsLoading] = useState(false);

  // Define series (channels)
  const series: Series[] = [
    { key: 'imo', label: 'IMO', color: '#5aa9e6' },
    { key: 'bank', label: 'Bank', color: '#7fc8f8' },
    { key: 'ibd', label: 'IBD', color: '#ffe45e' },
    { key: 'wirehouse', label: 'Wirehouse', color: '#6c757d' },
  ];

  // Generate mock data for 12 months
  const generateMockData = (): DataPoint[] => {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const baseYear = 2024;

    return months.map((month, index) => {
      const date = new Date(baseYear, index, 1);

      // Simulate growth over time with some randomness
      const growthFactor = 1 + index * 0.15;

      return {
        date,
        values: {
          imo: Math.round((4 + Math.random() * 2) * growthFactor),
          bank: Math.round((3 + Math.random() * 1.5) * growthFactor),
          ibd: Math.round((2 + Math.random() * 1) * growthFactor),
          wirehouse: Math.round((1 + Math.random() * 0.5) * growthFactor),
        },
      };
    });
  };

  const data = generateMockData();

  // Calculate summary metrics (using latest data point)
  const latestData = data[data.length - 1];
  const totalUsers = Object.values(latestData.values).reduce((sum, val) => sum + val, 0);

  return (
    <div
      style={{
        padding: '40px',
        backgroundColor: '#f8f9fa',
        minHeight: '100vh',
      }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
          }}
        >
          <h1 style={{ margin: 0, fontSize: '32px', color: '#333' }}>Users Chart Demo</h1>
          <button
            onClick={() => setIsLoading(!isLoading)}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              backgroundColor: isLoading ? '#fff' : '#4a90e2',
              color: isLoading ? '#333' : '#fff',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
          >
            {isLoading ? 'Hide Loading' : 'Show Loading'}
          </button>
        </div>

        {/* Chart Container */}
        <div
          style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            height: '700px',
          }}
        >
          <UsersChart
            data={data}
            series={series}
            isLoading={isLoading}
            showLegend={true}
            metricsSummary={{
              newCount: 3421,
              returnCount: 9823,
            }}
            newLabel="New"
            returnLabel="Return"
          />
        </div>

        {/* Features Documentation */}
        <div
          style={{
            marginTop: '40px',
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: '24px', color: '#333' }}>Features</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            <div>
              <h3 style={{ fontSize: '18px', color: '#4a90e2', marginBottom: '12px' }}>
                Interactive Area Chart
              </h3>
              <ul style={{ color: '#666', lineHeight: '1.8' }}>
                <li>D3-powered stacked area chart with smooth curves</li>
                <li>Hover to see tooltip with detailed values at any point</li>
                <li>Vertical crosshair line follows mouse position</li>
                <li>Click legend items to toggle series visibility</li>
                <li>Responsive sizing adapts to container dimensions</li>
              </ul>
            </div>

            <div>
              <h3 style={{ fontSize: '18px', color: '#4a90e2', marginBottom: '12px' }}>
                Dynamic Metrics Bars
              </h3>
              <ul style={{ color: '#666', lineHeight: '1.8' }}>
                <li>Bars update in real-time as you hover over the chart</li>
                <li>Shows percentage distribution at the hovered date</li>
                <li>Click bars to toggle corresponding series in chart</li>
                <li>Visual feedback for disabled/hidden series</li>
                <li>Smooth transitions for percentage changes</li>
              </ul>
            </div>

            <div>
              <h3 style={{ fontSize: '18px', color: '#4a90e2', marginBottom: '12px' }}>
                Flexible Data Model
              </h3>
              <ul style={{ color: '#666', lineHeight: '1.8' }}>
                <li>Generic series configuration - works with any categories</li>
                <li>Custom labels and colors for each series</li>
                <li>Time-based data with automatic date formatting</li>
                <li>Configurable metric summaries (New/Return counts)</li>
                <li>Easy to extend with additional data points</li>
              </ul>
            </div>

            <div>
              <h3 style={{ fontSize: '18px', color: '#4a90e2', marginBottom: '12px' }}>
                Usage Example
              </h3>
              <pre
                style={{
                  backgroundColor: '#f5f5f5',
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  overflow: 'auto',
                }}
              >
                {`<UsersChart
  data={data}
  series={series}
  isLoading={false}
  showLegend={true}
  metricsSummary={{
    newCount: 3421,
    returnCount: 9823,
  }}
/>`}
              </pre>
            </div>
          </div>

          <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
            <h3 style={{ fontSize: '18px', color: '#333', marginBottom: '12px' }}>
              How Hover Interaction Works
            </h3>
            <p style={{ color: '#666', lineHeight: '1.8', margin: 0 }}>
              When you move your mouse over the area chart, the component uses D3's bisector to find
              the nearest data point at that X position. The bars below automatically update to show
              the exact values and percentages at that specific date. When you're not hovering, the
              bars display the latest data point (December in this demo). This creates a seamless,
              interactive experience where the entire component responds to your exploration of the
              data.
            </p>
          </div>
        </div>

        {/* Sample Data Display */}
        <div
          style={{
            marginTop: '20px',
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}
        >
          <h3 style={{ fontSize: '18px', color: '#333', marginTop: 0 }}>Sample Data Structure</h3>
          <pre
            style={{
              backgroundColor: '#f5f5f5',
              padding: '16px',
              borderRadius: '6px',
              fontSize: '12px',
              overflow: 'auto',
              maxHeight: '300px',
            }}
          >
            {JSON.stringify(
              {
                series: series,
                sampleDataPoint: {
                  date: '2024-01-01T00:00:00.000Z',
                  values: {
                    imo: 5,
                    bank: 3,
                    ibd: 2,
                    wirehouse: 1,
                  },
                },
                totalDataPoints: data.length,
              },
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </div>
  );
};
