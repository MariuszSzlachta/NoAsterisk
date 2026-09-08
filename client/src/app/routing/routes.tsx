import { createBrowserRouter, Navigate } from 'react-router-dom';

import { AppShell } from '#app/layouts/AppShell';
import { RequireAuth } from '#app/routing/RequireAuth';
import { RequireRole } from '#app/routing/RequireRole';
import { RequireVault } from '#app/routing/RequireVault';
import { AdminPage } from '#pages/AdminPage';
import { AdminRulesPage } from '#pages/AdminRulesPage';
import { AnalyticsPage } from '#pages/AnalyticsPage';
import { BudgetsPage } from '#pages/BudgetsPage';
import { DashboardPage } from '#pages/DashboardPage';
import { ImportPage } from '#pages/ImportPage';
import { LoginPage } from '#pages/LoginPage';
import { RegisterPage } from '#pages/RegisterPage';
import { TransactionsPage } from '#pages/TransactionsPage';
import { UserSettingsPage } from '#pages/UserSettingsPage';
import { ImportHistoryPage } from '#features/csv-import';

export const router = createBrowserRouter([
  {
    element: <RequireAuth />,
    children: [
      {
        path: '/admin',
        element: <RequireRole role="Superuser" />,
        children: [
          {
            element: <RequireVault />,
            children: [
              {
                element: <AppShell />,
                children: [{ index: true, element: <AdminPage /> }],
              },
            ],
          },
        ],
      },
      {
        element: <RequireVault />,
        children: [
          {
            element: <AppShell />,
            children: [
              { path: '/', element: <Navigate to="/dashboard" replace /> },
              { path: '/dashboard', element: <DashboardPage /> },
              { path: '/transactions', element: <TransactionsPage /> },
              { path: '/import', element: <ImportPage /> },
              { path: '/import-history', element: <ImportHistoryPage /> },
              { path: '/budgets', element: <BudgetsPage /> },
              { path: '/analytics', element: <AnalyticsPage /> },
              { path: '/admin/rules', element: <AdminRulesPage /> },
              { path: '/settings', element: <UserSettingsPage /> },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
]);
