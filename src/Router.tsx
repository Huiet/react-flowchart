import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom';
import { ApplicationTrackingDemo } from './ApplicationTrackingDemo';
import { Navigation } from './components/Navigation';
import { D3BarChartDemo } from './D3BarChartDemo';
import { D3PieChartDemo } from './D3PieChartDemo';
import { D3StockChartDemo } from './D3StockChartDemo';
import { FlowChartDemo } from './FlowChartDemo';
import { FlowChartV2Demo } from './FlowChartV2Demo';
import { HomePage } from './pages/Home.page';
import { StatsCardDemo } from './StatsCardDemo';
import { UsersChartDemo } from './UsersChartDemo';
import { ZipMapDemo } from './ZipMapDemo';
import { ZipMapWebGLDemo } from './ZipMapWebGLDemo';

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
      {
        path: '/d3-pie-chart-demo',
        element: <D3PieChartDemo />,
      },
      {
        path: '/users-chart-demo',
        element: <UsersChartDemo />,
      },
      {
        path: '/stats-card-demo',
        element: <StatsCardDemo />,
      },
      {
        path: '/application-tracking-demo',
        element: <ApplicationTrackingDemo />,
      },
      {
        path: '/zip-map-demo',
        element: <ZipMapDemo />,
      },

      {
        path: '/zip-map-webgl-demo',
        element: <ZipMapWebGLDemo />,
      },
    ],
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
