import { createBrowserRouter } from 'react-router-dom';
import { HomePage } from '../../pages/HomePage';
import { ImportPage } from '../../pages/ImportPage';
import { DashboardPage } from '../../pages/DashboardPage';
import { AdminRulesPage } from '../../pages/AdminRulesPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/import',
    element: <ImportPage />,
  },
  {
    path: '/dashboard',
    element: <DashboardPage />,
  },
  {
    path: '/admin/rules',
    element: <AdminRulesPage />,
  },
]);
