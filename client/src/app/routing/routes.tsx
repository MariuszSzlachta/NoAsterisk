import { Navigate, createBrowserRouter } from 'react-router-dom';

import { AppShell } from '#app/layouts/AppShell';
import { AdminRulesPage } from '#pages/AdminRulesPage';
import { BudgetsPage } from '#pages/BudgetsPage';
import { DashboardPage } from '#pages/DashboardPage';
import { ImportPage } from '#pages/ImportPage';
import { TransactionsPage } from '#pages/TransactionsPage';

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <Navigate to="/dashboard" replace /> },
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/transactions', element: <TransactionsPage /> },
      { path: '/import', element: <ImportPage /> },
      { path: '/budgets', element: <BudgetsPage /> },
      { path: '/admin/rules', element: <AdminRulesPage /> },
    ],
  },
]);
