import { useState } from 'react';
import { ApplicationTrackingChart, MetricData } from './components/ApplicationTrackingChart';

const mockData: MetricData[] = [
  {
    label: 'Total Accounts',
    value: 1247,
    percentage: 100,
  },
  {
    label: 'Active Accounts',
    value: 1089,
    percentage: 87.3,
  },
  {
    label: 'Discovery',
    value: 980,
    percentage: 78.6,
  },
  {
    label: 'Applications Started',
    value: 920,
    percentage: 73.8,
  },
  {
    label: 'Completed',
    value: 853,
    percentage: 68.4,
  },
];

export const ApplicationTrackingDemo = () => {
  const [isLoading, setIsLoading] = useState(false);

  const toggleLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div
      style={{
        padding: '40px 20px',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '30px',
          }}
        >
          <div>
            <h1 style={{ color: 'white', margin: '0 0 10px 0' }}>
              Application Tracking Chart Demo
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.9)', margin: 0 }}>
              Responsive circular metrics that scale and wrap based on viewport size
            </p>
          </div>
          <button
            onClick={toggleLoading}
            style={{
              padding: '10px 20px',
              background: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              color: '#667eea',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            }}
          >
            Toggle Loading
          </button>
        </div>

        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
            minHeight: '400px',
          }}
        >
          <ApplicationTrackingChart data={mockData} isLoading={isLoading} />
        </div>

        <div
          style={{
            marginTop: '40px',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '30px',
            color: 'white',
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: '24px', fontWeight: 600 }}>Features</h2>
          <ul style={{ lineHeight: '1.8', fontSize: '15px' }}>
            <li>
              <strong>Fully Responsive:</strong> Circles scale down proportionally as the viewport
              shrinks
            </li>
            <li>
              <strong>Automatic Wrapping:</strong> Metrics wrap to multiple lines when the viewport
              becomes too narrow
            </li>
            <li>
              <strong>Status-based Colors:</strong> Gray for initial, blue shades for active stages,
              green for completed
            </li>
            <li>
              <strong>Interactive Hover:</strong> Circles scale up slightly on hover for better
              visual feedback
            </li>
            <li>
              <strong>Smart Arrows:</strong> Connecting arrows only show when metrics are in a
              single row
            </li>
            <li>
              <strong>Loading State:</strong> Built-in loading overlay for data fetching scenarios
            </li>
            <li>
              <strong>Clean Typography:</strong> Percentage labels displayed below each metric for
              clarity
            </li>
          </ul>

          <h3 style={{ marginTop: '30px', fontSize: '20px', fontWeight: 600 }}>Try This</h3>
          <ul style={{ lineHeight: '1.8', fontSize: '15px' }}>
            <li>Resize your browser window to see the circles scale and wrap</li>
            <li>Hover over any circle to see the scale effect</li>
            <li>Click "Toggle Loading" to see the loading state</li>
            <li>On narrow screens, notice how the arrows disappear and metrics stack vertically</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
