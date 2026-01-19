import { useState } from 'react';
import { D3PieChart } from './components/D3PieChart';
import { ChartType, PieChartDataPoint } from './components/D3PieChart/types';

const mockData: PieChartDataPoint[] = [
  {
    count: 10277,
    value: 1051620390.37,
    label: 'North American Company For Life And Health Insurance',
  },
  {
    count: 8543,
    value: 892340125.45,
    label: 'Metropolitan Life Insurance Company',
  },
  {
    count: 7821,
    value: 756890234.12,
    label: 'Prudential Insurance Company of America',
  },
  {
    count: 6432,
    value: 645230189.78,
    label: 'New York Life Insurance Company',
  },
  {
    count: 5234,
    value: 534120456.89,
    label: 'Massachusetts Mutual Life Insurance Company',
  },
  {
    count: 4567,
    value: 467890345.23,
    label: 'Northwestern Mutual Life Insurance Company',
  },
  {
    count: 3892,
    value: 389450234.56,
    label: 'John Hancock Life Insurance Company',
  },
  {
    count: 3245,
    value: 312340567.34,
    label: 'Lincoln National Life Insurance Company',
  },
  {
    count: 2789,
    value: 278920123.45,
    label: 'Principal Life Insurance Company',
  },
  {
    count: 2134,
    value: 213450789.12,
    label: 'Pacific Life Insurance Company',
  },
];

export function D3PieChartDemo() {
  const [isLoading, setIsLoading] = useState(false);
  const [chartType, setChartType] = useState<ChartType>('pie');

  const handleToggleLoading = () => {
    setIsLoading(!isLoading);
  };

  return (
    <div
      style={{
        padding: '20px',
        height: 'calc(100vh - 80px)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', color: '#1e3a5f', fontWeight: 'bold' }}>
            D3 Pie/Donut Chart Demo
          </h1>
          <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>
            Insurance companies by total value - Interactive pie and donut charts with tooltips
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => setChartType('pie')}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                backgroundColor: chartType === 'pie' ? '#0071e3' : 'white',
                color: chartType === 'pie' ? 'white' : '#666',
                border: '1px solid #ddd',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 500,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (chartType !== 'pie') {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                  e.currentTarget.style.borderColor = '#999';
                }
              }}
              onMouseLeave={(e) => {
                if (chartType !== 'pie') {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.borderColor = '#ddd';
                }
              }}
            >
              Pie
            </button>
            <button
              onClick={() => setChartType('donut')}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                backgroundColor: chartType === 'donut' ? '#0071e3' : 'white',
                color: chartType === 'donut' ? 'white' : '#666',
                border: '1px solid #ddd',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 500,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (chartType !== 'donut') {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                  e.currentTarget.style.borderColor = '#999';
                }
              }}
              onMouseLeave={(e) => {
                if (chartType !== 'donut') {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.borderColor = '#ddd';
                }
              }}
            >
              Donut
            </button>
          </div>
          <button
            onClick={handleToggleLoading}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              backgroundColor: isLoading ? '#dc2626' : '#0071e3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isLoading ? '#b91c1c' : '#005bb5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isLoading ? '#dc2626' : '#0071e3';
            }}
          >
            {isLoading ? 'Hide Loading' : 'Show Loading'}
          </button>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          backgroundColor: 'white',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
        }}
      >
        <D3PieChart
          data={mockData}
          isLoading={isLoading}
          chartType={chartType}
          showLegend={false}
          showLabels={false}
        />
      </div>
    </div>
  );
}
