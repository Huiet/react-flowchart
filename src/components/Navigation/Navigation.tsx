import { Link, useLocation } from 'react-router-dom';

export function Navigation() {
  const location = useLocation();
  return (
    <nav style={{
      backgroundColor: '#1e3a5f',
      padding: '15px 30px',
      display: 'flex',
      gap: '20px',
      alignItems: 'center',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    }}>
      <Link
        to="/"
        style={{
          color: '#ffffff',
          textDecoration: 'none',
          fontSize: '18px',
          fontWeight: 'bold',
          padding: '8px 16px',
          backgroundColor: location.pathname === '/' ? 'rgba(255,255,255,0.25)' : 'transparent',
          borderRadius: '4px',
          transition: 'background-color 0.2s',
        }}
      >
        Home
      </Link>
      <Link
        to="/flowchart-demo"
        style={{
          color: '#ffffff',
          textDecoration: 'none',
          fontSize: '16px',
          padding: '8px 16px',
          backgroundColor: location.pathname === '/flowchart-demo' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
          borderRadius: '4px',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          if (location.pathname !== '/flowchart-demo') {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
          }
        }}
        onMouseLeave={(e) => {
          if (location.pathname !== '/flowchart-demo') {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
          }
        }}
      >
        FlowChart V1
      </Link>
      <Link
        to="/flowchart-v2-demo"
        style={{
          color: '#ffffff',
          textDecoration: 'none',
          fontSize: '16px',
          padding: '8px 16px',
          backgroundColor: location.pathname === '/flowchart-v2-demo' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
          borderRadius: '4px',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          if (location.pathname !== '/flowchart-v2-demo') {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
          }
        }}
        onMouseLeave={(e) => {
          if (location.pathname !== '/flowchart-v2-demo') {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
          }
        }}
      >
        FlowChart V2
      </Link>
      <Link
        to="/d3-stock-chart-demo"
        style={{
          color: '#ffffff',
          textDecoration: 'none',
          fontSize: '16px',
          padding: '8px 16px',
          backgroundColor: location.pathname === '/d3-stock-chart-demo' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
          borderRadius: '4px',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          if (location.pathname !== '/d3-stock-chart-demo') {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
          }
        }}
        onMouseLeave={(e) => {
          if (location.pathname !== '/d3-stock-chart-demo') {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
          }
        }}
      >
        D3 Stock Chart
      </Link>
      <Link
        to="/d3-bar-chart-demo"
        style={{
          color: '#ffffff',
          textDecoration: 'none',
          fontSize: '16px',
          padding: '8px 16px',
          backgroundColor: location.pathname === '/d3-bar-chart-demo' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
          borderRadius: '4px',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          if (location.pathname !== '/d3-bar-chart-demo') {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
          }
        }}
        onMouseLeave={(e) => {
          if (location.pathname !== '/d3-bar-chart-demo') {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
          }
        }}
      >
        D3 Bar Chart
      </Link>
      <Link
        to="/d3-pie-chart-demo"
        style={{
          color: '#ffffff',
          textDecoration: 'none',
          fontSize: '16px',
          padding: '8px 16px',
          backgroundColor: location.pathname === '/d3-pie-chart-demo' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
          borderRadius: '4px',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          if (location.pathname !== '/d3-pie-chart-demo') {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
          }
        }}
        onMouseLeave={(e) => {
          if (location.pathname !== '/d3-pie-chart-demo') {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
          }
        }}
      >
        D3 Pie Chart
      </Link>
      <Link
        to="/users-chart-demo"
        style={{
          color: '#ffffff',
          textDecoration: 'none',
          fontSize: '16px',
          padding: '8px 16px',
          backgroundColor: location.pathname === '/users-chart-demo' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
          borderRadius: '4px',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          if (location.pathname !== '/users-chart-demo') {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
          }
        }}
        onMouseLeave={(e) => {
          if (location.pathname !== '/users-chart-demo') {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
          }
        }}
      >
        Users Chart
      </Link>
      <Link
        to="/stats-card-demo"
        style={{
          color: '#ffffff',
          textDecoration: 'none',
          fontSize: '16px',
          padding: '8px 16px',
          backgroundColor: location.pathname === '/stats-card-demo' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
          borderRadius: '4px',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          if (location.pathname !== '/stats-card-demo') {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
          }
        }}
        onMouseLeave={(e) => {
          if (location.pathname !== '/stats-card-demo') {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
          }
        }}
      >
        Stats Card
      </Link>
    </nav>
  );
}
