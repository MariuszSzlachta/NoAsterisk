import { createBrowserRouter } from 'react-router-dom';

import { AdminRulesPage } from '#pages/AdminRulesPage';
import { DashboardPage } from '#pages/DashboardPage';
import { HomePage } from '#pages/HomePage';
import { ImportPage } from '#pages/ImportPage';

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
