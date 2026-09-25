import { createBrowserRouter, Navigate } from 'react-router-dom';

import { AppShellSkeleton } from '#app/layouts/AppShell/AppShellSkeleton';
import { RequireAuth } from '#app/routing/RequireAuth';
import { RequireRole } from '#app/routing/RequireRole';
import { RequireVault } from '#app/routing/RequireVault';

export const router = createBrowserRouter([
  {
    element: <RequireAuth />,
    HydrateFallback: AppShellSkeleton,
    children: [
      {
        path: '/admin',
        element: <RequireRole role="Superuser" />,
        children: [
          {
            element: <RequireVault />,
            children: [
              {
                lazy: async () => ({
                  Component: (await import('#app/layouts/AppShell/AppShell'))
                    .AppShell,
                }),
                children: [
                  {
                    index: true,
                    lazy: async () => ({
                      Component: (await import('#pages/AdminPage')).AdminPage,
                    }),
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        element: <RequireVault />,
        children: [
          {
            lazy: async () => ({
              Component: (await import('#app/layouts/AppShell/AppShell'))
                .AppShell,
            }),
            children: [
              { path: '/', element: <Navigate to="/dashboard" replace /> },
              {
                path: '/dashboard',
                lazy: async () => ({
                  Component: (await import('#pages/DashboardPage'))
                    .DashboardPage,
                }),
              },
              {
                path: '/transactions',
                lazy: async () => ({
                  Component: (await import('#pages/TransactionsPage'))
                    .TransactionsPage,
                }),
              },
              {
                path: '/import',
                lazy: async () => ({
                  Component: (await import('#pages/ImportPage')).ImportPage,
                }),
              },
              {
                path: '/import-history',
                lazy: async () => ({
                  Component: (
                    await import('#features/csv-import/ui/ImportHistoryPage/ImportHistoryPage')
                  ).ImportHistoryPage,
                }),
              },
              {
                path: '/budgets',
                lazy: async () => ({
                  Component: (await import('#pages/BudgetsPage')).BudgetsPage,
                }),
              },
              {
                path: '/analytics',
                lazy: async () => ({
                  Component: (await import('#pages/AnalyticsPage'))
                    .AnalyticsPage,
                }),
              },
              {
                path: '/admin/rules',
                lazy: async () => ({
                  Component: (await import('#pages/AdminRulesPage'))
                    .AdminRulesPage,
                }),
              },
              {
                path: '/settings',
                lazy: async () => ({
                  Component: (await import('#pages/UserSettingsPage'))
                    .UserSettingsPage,
                }),
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '/login',
    HydrateFallback: AppShellSkeleton,
    lazy: async () => ({
      Component: (await import('#pages/LoginPage')).LoginPage,
    }),
  },
  {
    path: '/register',
    HydrateFallback: AppShellSkeleton,
    lazy: async () => ({
      Component: (await import('#pages/RegisterPage')).RegisterPage,
    }),
  },
  {
    path: '/privacy',
    HydrateFallback: AppShellSkeleton,
    lazy: async () => ({
      Component: (await import('#pages/PrivacyPage')).PrivacyPage,
    }),
  },
  {
    path: '/terms',
    HydrateFallback: AppShellSkeleton,
    lazy: async () => ({
      Component: (await import('#pages/TermsPage')).TermsPage,
    }),
  },
]);
