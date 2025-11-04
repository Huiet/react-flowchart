import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { HomePage } from './pages/Home.page';
import { FlowChartDemo } from './FlowChartDemo';
import { FlowChartV2Demo } from './FlowChartV2Demo';
import { D3StockChartDemo } from './D3StockChartDemo';
import { D3BarChartDemo } from './D3BarChartDemo';
import { Navigation } from './components/Navigation';

function Layout() {
  return (
    <>
      <Navigation />
      <Outlet />
    </>
  );
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <HomePage />,
      },
      {
        path: '/flowchart-demo',
        element: <FlowChartDemo />,
      },
      {
        path: '/flowchart-v2-demo',
        element: <FlowChartV2Demo />,
      },
      {
        path: '/d3-stock-chart-demo',
        element: <D3StockChartDemo />,
      },
      {
        path: '/d3-bar-chart-demo',
        element: <D3BarChartDemo />,
      },
    ],
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
