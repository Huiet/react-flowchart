import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { HomePage } from './pages/Home.page';
import { FlowChartDemo } from './FlowChartDemo';

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/flowchart-demo',
    element: <FlowChartDemo />,
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
