import { Navigate, createBrowserRouter } from 'react-router-dom';

import { AppShell } from '#app/layouts/AppShell';
import { RequireAuth } from '#app/routing/RequireAuth';
import { AdminRulesPage } from '#pages/AdminRulesPage';
import { BalanceReportPage } from '#pages/BalanceReportPage';
import { BudgetsPage } from '#pages/BudgetsPage';
import { DashboardPage } from '#pages/DashboardPage';
import { ExpenseReportPage } from '#pages/ExpenseReportPage';
import { ImportPage } from '#pages/ImportPage';
import { IncomeReportPage } from '#pages/IncomeReportPage';
import { SavingsReportPage } from '#pages/SavingsReportPage';
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
          { path: '/admin/rules', element: <AdminRulesPage /> },
          { path: '/reports/balance', element: <BalanceReportPage /> },
          { path: '/reports/income', element: <IncomeReportPage /> },
          { path: '/reports/expenses', element: <ExpenseReportPage /> },
          { path: '/reports/savings', element: <SavingsReportPage /> },
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
