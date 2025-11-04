import { D3BarChart } from './components/D3BarChart';
import type { BarDataPoint, BarSeries } from './components/D3BarChart';

export const D3BarChartDemo = () => {
  // Sample data similar to the image
  const data: BarDataPoint[] = [
    {
      category: 'Nov 1 - 2',
      values: {
        maturing: 0,
        callOpportunity: 0,
      },
    },
    {
      category: 'Nov 3 - 9',
      values: {
        maturing: 50000000,
        callOpportunity: 429000000,
      },
    },
    {
      category: 'Nov 10 - 16',
      values: {
        maturing: 68000000,
        callOpportunity: 500000000,
      },
    },
    {
      category: 'Nov 17 - 23',
      values: {
        maturing: 1020000000,
        callOpportunity: 606000000,
      },
    },
    {
      category: 'Nov 24 - 30',
      values: {
        maturing: 457000000,
        callOpportunity: 457000000,
      },
    },
    {
      category: 'Dec 1 - 7',
      values: {
        maturing: 0,
        callOpportunity: 0,
      },
    },
  ];

  const series: BarSeries[] = [
    {
      key: 'maturing',
      label: 'Maturing',
      color: '#1e3a5f', // Dark blue
    },
    {
      key: 'callOpportunity',
      label: 'Call Opportunity',
      color: '#4a7ba7', // Medium blue
    },
  ];

  return (
    <div style={{ padding: '40px', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '10px', color: '#2c3e50' }}>D3 Bar Chart Demo</h1>
        <p style={{ marginBottom: '30px', color: '#7f8c8d', fontSize: '14px' }}>
          Interactive grouped bar chart with hover tooltips and toggleable series
        </p>

        <div
          style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            height: '500px',
          }}
        >
          <D3BarChart
            data={data}
            series={series}
            showValues={true}
            showLegend={true}
            yAxisLabel=""
            xAxisLabel="Date"
          />
        </div>

        <div
          style={{
            marginTop: '30px',
            padding: '20px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <h2 style={{ marginBottom: '15px', color: '#2c3e50', fontSize: '18px' }}>Features</h2>
          <ul style={{ color: '#555', lineHeight: '1.8' }}>
            <li>
              <strong>Grouped Bars:</strong> Multiple bars per category for easy comparison
            </li>
            <li>
              <strong>Interactive Tooltips:</strong> Hover over bars to see detailed values
            </li>
            <li>
              <strong>Value Labels:</strong> Values displayed on top of each bar for quick reading
            </li>
            <li>
              <strong>Toggle Series:</strong> Click legend items to show/hide specific series
            </li>
            <li>
              <strong>Responsive Design:</strong> Automatically resizes to fit its container
            </li>
            <li>
              <strong>Custom Formatting:</strong> Smart value formatting (e.g., 50MM for millions)
            </li>
            <li>
              <strong>Clean Styling:</strong> Professional appearance with grid lines and proper spacing
            </li>
          </ul>
        </div>

        <div
          style={{
            marginTop: '20px',
            padding: '20px',
            backgroundColor: '#fff3cd',
            borderRadius: '8px',
            border: '1px solid #ffc107',
          }}
        >
          <h3 style={{ marginTop: 0, color: '#856404', fontSize: '16px' }}>💡 Try This</h3>
          <ul style={{ color: '#856404', lineHeight: '1.8', marginBottom: 0 }}>
            <li>Hover over any bar to see a detailed tooltip with all values</li>
            <li>Click on legend items to show/hide specific series</li>
            <li>Resize your browser window to see the responsive behavior</li>
            <li>Notice the smart value formatting (50MM for 50 million)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
