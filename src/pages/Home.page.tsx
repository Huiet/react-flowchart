import { Link } from 'react-router-dom';
import { Button } from '@mantine/core';
import { ColorSchemeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';
import { Welcome } from '../components/Welcome/Welcome';

export function HomePage() {
  return (
    <>
      <Welcome />
      <ColorSchemeToggle />
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <Link to="/flowchart-demo">
          <Button size="lg" variant="filled">
            View FlowChart Demo
          </Button>
        </Link>
      </div>
    </>
  );
}
