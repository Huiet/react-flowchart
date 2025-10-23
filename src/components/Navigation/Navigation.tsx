import { Link } from 'react-router-dom';

export function Navigation() {
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
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: '4px',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
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
          backgroundColor: '#4CAF50',
          borderRadius: '4px',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#45a049'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4CAF50'}
      >
        FlowChart V2 (NEW)
      </Link>
    </nav>
  );
}
