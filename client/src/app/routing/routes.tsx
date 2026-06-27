import { createBrowserRouter, Navigate } from 'react-router-dom';

import { AppShell } from '#app/layouts/AppShell';
import { RequireAuth } from '#app/routing/RequireAuth';
import { AdminRulesPage } from '#pages/AdminRulesPage';
import { AnalyticsPage } from '#pages/AnalyticsPage';
import { BudgetsPage } from '#pages/BudgetsPage';
import { DashboardPage } from '#pages/DashboardPage';
import { ImportPage } from '#pages/ImportPage';
import { TransactionsPage } from '#pages/TransactionsPage';

export const router = createBrowserRouter([
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/transactions', element: <TransactionsPage /> },
          { path: '/import', element: <ImportPage /> },
          { path: '/budgets', element: <BudgetsPage /> },
          { path: '/analytics', element: <AnalyticsPage /> },
          { path: '/admin/rules', element: <AdminRulesPage /> },
        ],
      },
    ],
  },
  {
    path: '/login',
    // TODO: LoginPage component
    element: <div>Login</div>,
  },
]);
