import { Link } from 'react-router-dom';
import { Button } from '@mantine/core';
import { ColorSchemeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';
import { Welcome } from '../components/Welcome/Welcome';

export function HomePage() {
  return (
    <>
      <Welcome />
      <ColorSchemeToggle />
      <div
        style={{
          marginTop: '20px',
          textAlign: 'center',
          display: 'flex',
          gap: '10px',
          justifyContent: 'center',
        }}
      >
        <Link to="/flowchart-demo">
          <Button size="lg" variant="filled">
            FlowChart Demo (V1)
          </Button>
        </Link>
        <Link to="/flowchart-v2-demo">
          <Button size="lg" variant="filled" color="green">
            FlowChart Demo (V2 - NEW)
          </Button>
        </Link>
      </div>
    </>
  );
}
